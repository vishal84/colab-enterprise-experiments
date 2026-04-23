import json
import requests
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configuration
BOARD_ID = os.getenv("MIRO_BOARD_ID")
ACCESS_TOKEN = os.getenv("MIRO_ACCESS_TOKEN")
JSON_FILE = "../architecture/miro_blueprint.json"

if not BOARD_ID or not ACCESS_TOKEN:
    print("Error: MIRO_BOARD_ID and MIRO_ACCESS_TOKEN must be set in your .env file.")
    exit(1)

BASE_URL = f"https://api.miro.com/v2/boards/{BOARD_ID}"
HEADERS = {
    "Authorization": f"Bearer {ACCESS_TOKEN}",
    "Content-Type": "application/json"
}

def import_to_miro():
    if not os.path.exists(JSON_FILE):
        print(f"Error: {JSON_FILE} not found.")
        return

    with open(JSON_FILE, "r") as f:
        data = json.load(f)

    item_map = {} # Maps content/title to Miro ID for connectors

    print(f"Starting import to board: {BOARD_ID}...")

    # 1. Create Frames
    for frame in data.get("frames", []):
        print(f"Creating frame: {frame['title']}...")
        payload = {
            "data": {"title": frame["title"]},
            "geometry": frame["geometry"],
            "position": frame["position"]
        }
        res = requests.post(f"{BASE_URL}/frames", headers=HEADERS, json=payload).json()
        frame_id = res.get("id")
        
        if not frame_id:
            print(f"Failed to create frame: {res}")
            continue

        # 2. Create Items inside Frames
        for item in frame.get("items", []):
            item_payload = {
                "data": {"content": item["content"]},
                "position": {
                    "x": item["position"]["x"],
                    "y": item["position"]["y"],
                    "origin": "center"
                },
                "style": {"fillColor": item["style"]["fillColor"]},
                "parent": {"id": frame_id}
            }
            item_res = requests.post(f"{BASE_URL}/sticky_notes", headers=HEADERS, json=item_payload).json()
            item_map[item["content"]] = item_res.get("id")

    # 3. Create Connectors
    print("Creating connectors...")
    for conn in data.get("connectors", []):
        if conn["start"] in item_map and conn["end"] in item_map:
            conn_payload = {
                "startItem": {"id": item_map[conn["start"]]},
                "endItem": {"id": item_map[conn["end"]]},
                "style": {"strokeColor": conn["style"]["strokeColor"]}
            }
            requests.post(f"{BASE_URL}/connectors", headers=HEADERS, json=conn_payload)

    print("Import Complete! Check your Miro board.")

if __name__ == "__main__":
    import_to_miro()
