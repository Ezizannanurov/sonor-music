import urllib.request
import json

url = "https://api.render.com/v1/services/srv-dbocd1lg1s2s73eprdc0/deploys?limit=3"
headers = {"Authorization": "Bearer rnd_TGUdnMWlp0S3P6IRKrjqRs9H6M62"}
req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        for item in data:
            d = item.get("deploy", {})
            commit = d.get("commit", {})
            print(f"Deploy ID: {d.get('id')}, Status: {d.get('status')}, Commit: {commit.get('id')}, Msg: {commit.get('message')}")
except Exception as e:
    print(f"Error: {e}")
