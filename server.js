import cv2
from picamera2 import Picamera2
from ultralytics import YOLO
import cvzone
from hx711 import HX711
import RPi.GPIO as GPIO
import time
import requests
import json

# Initialize the HX711 load cell
GPIO.setmode(GPIO.BCM)
hx = HX711(dout_pin=20, pd_sck_pin=21)
hx.set_scale_ratio(419.569)
hx.zero()

# Define classes for freshness detection
classes = [
    "Fresh-Apple", "Fresh-Mango", "Fresh-Banana", "FreshBellpepper", "FreshCarrot",
    "FreshCucumber", "FreshOrange", "FreshPotato", "FreshStrawberry", "FreshTomato",
    "Rotten-Apple", "RottenBanana", "RottenBellpepper", "RottenCarrot", "RottenCucumber",
    "RottenMango", "RottenOrange", "RottenPotato", "RottenStrawberry", "RottenTomato"
]

# Initialize the Picamera2
picam2 = Picamera2()
picam2.preview_configuration.main.size = (480, 480)
picam2.preview_configuration.main.format = "RGB888"
picam2.preview_configuration.align()
picam2.configure("preview")
picam2.start()

# Load the YOLOv8 model
model = YOLO("best.onnx")

# Define pricing per gram for fresh items (example values)
pricing = {
    "Fresh-Apple": 0.05, "Fresh-Mango": 0.06, "Fresh-Banana": 0.03,
    "FreshBellpepper": 0.04, "FreshCarrot": 0.02, "FreshCucumber": 0.03,
    "FreshOrange": 0.05, "FreshPotato": 0.01, "FreshStrawberry": 0.10,
    "FreshTomato": 0.04
}

# Initialize variables
count = 0
logged_items = {}  # Track logged items with weight and price

# Backend URL (Modify with your backend URL)
url = "https://backend-for-fyp.onrender.com"  # Replace with your backend URL if needed

# Function to calculate weight
def get_weight():
    try:
        weight = hx.get_weight_mean(20)  # Ensure no negative weights
        print(f"Weight: {weight:.2f} g")
        return weight
    except Exception as e:
        print(f"Error reading weight: {e}")
        return 0

# Function to send product data to the backend API
def post_to_backend(class_name, weight, price):
    # Round weight and price to two decimal places for consistency
    weight = round(weight, 2)
    price = round(price, 2)

    data = {
        "name": class_name,
        "weight": weight,
        "price": price,
        "freshness": "Fresh" if "fresh" in class_name.lower() else "Rotten"
    }
    
    # Send POST request to the backend
    headers = {"Content-Type": "application/json"}
    try:
        response = requests.post(f"{url}/product", json=data, headers=headers)
        if response.status_code == 200:
            print(f"Successfully sent data for {class_name}")
        else:
            print(f"Failed to send data for {class_name}. Status Code: {response.status_code}")
    except Exception as e:
        print(f"Error sending data to backend: {e}")

# Main loop
while True:
    frame = picam2.capture_array()

    count += 1
    if count % 3 != 0:
        continue

    frame = cv2.flip(frame, -1)

    # Run YOLOv8 inference
    results = model.predict(frame, imgsz=240)

    # Process detection results
    for result in results:
        boxes = result.boxes.xyxy.numpy() if result.boxes.xyxy is not None else []
        class_ids = result.boxes.cls.numpy() if result.boxes.cls is not None else []
        confidences = result.boxes.conf.numpy() if result.boxes.conf is not None else []

        for box, class_id, conf in zip(boxes, class_ids, confidences):
            class_name = classes[int(class_id)]
            x1, y1, x2, y2 = map(int, box)

            weight = get_weight()
            price_per_gram = pricing.get(class_name, 0)
            total_price = weight * price_per_gram

            # Check if the same product is detected again within the same batch
            if class_name not in logged_items:
                # New item detection (not logged yet)
                logged_items[class_name] = {'weight': weight, 'price': total_price}
                post_to_backend(class_name, weight, total_price)
                print(f"New Product Detected: {class_name}, Weight: {weight:.2f}g, Price: Rs.{total_price:.2f}")
                cvzone.putTextRect(frame, f"{class_name} - {weight:.2f}g - Rs.{total_price:.2f}", (x1, y1 - 10), 1, 1)

            else:
                # Product already logged, check weight threshold
                prev_weight = logged_items[class_name]['weight']
                if abs(weight - prev_weight) > 5:  # Check if weight difference is greater than 5g
                    logged_items[class_name] = {'weight': weight, 'price': total_price}
                    post_to_backend(class_name, weight, total_price)
                    print(f"Weight updated for {class_name}, New Weight: {weight:.2f}g, New Price: Rs.{total_price:.2f}")
                    cvzone.putTextRect(frame, f"{class_name} - Updated - {weight:.2f}g - Rs.{total_price:.2f}", (x1, y1 - 10), 1, 1)

                else:
                    # No significant weight change, do not update
                    print(f"No significant update for {class_name}. Weight: {weight:.2f}g")

            # Draw bounding box
            color = (0, 255, 0) if "Fresh" in class_name else (0, 0, 255)
            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)

    # Display the frame
    cv2.imshow("Autonomous Checkout", frame)

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

# Clean up
picam2.stop()
GPIO.cleanup()
cv2.destroyAllWindows()

