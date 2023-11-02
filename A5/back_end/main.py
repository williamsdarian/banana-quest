import json
from typing import Mapping, Dict, List, Tuple, Any 
import os 
from http_daemon import delay_open_url, serve_pages

# Dict = {}
# List = []
# Tuple = ()

map: Mapping[str, Any] = {}

def loadMap() -> None:
    global map
    os.chdir(r'C:\Users\willi\Documents\University of Arkansas - Assignments\Fall 2023\CSCE 3193\A5\back_end')
    with open('map.json', 'rb') as f:
        s = f.read()
    map = json.loads(s)

class Player:
    def __init__(self, id: str) -> None:
        self.id = id
        self.name = ""
        self.x = 0
        self.y = 0
        self.whatIKnow = 0

players: Dict[str, Player] = {}
history: List[Player] = []


def update(payload: Mapping[str, Any]) -> Mapping[str, Any]:
  
    print(payload)
    action = payload["action"]

    if action == "iJustClicked":
        player = find_player(payload["id"])
        player.name = payload["name"]
        player.x = payload["x"]
        player.y = payload["y"]
        history.append(player)
    elif action == "iWantUpdates":
        player = find_player(payload["id"])
        remaining_history = history[player.whatIKnow:]
        player.whatIKnow = len(history)
        updates: List[Tuple[str, str, int, int]] = []
        for i in range(len(remaining_history)):
            player = remaining_history[i]
            update_tuple = (player.id, player.name, player.x, player.y)
            updates.append(update_tuple)
        return {
            "updates" : updates
        }
    elif action == "getMap":
        loadMap()
        return {
            'status': 'map',
            'map': map,
        }
    

    print(f'make_ajax_page was called with {payload}')
    return {
        'message': 'yo momma',
    }

# finds player currently in Dict
# adds new player if not in Dict 
def find_player(player_id: str) -> Player:
    if player_id in players:
        return players[player_id]
    else:
        # when the player is not found
        new_player = Player(player_id)
        players[player_id] = new_player
        return new_player


def main() -> None:
    # Get set up
    os.chdir(os.path.join(os.path.dirname(__file__), '../front_end'))

    # Serve pages
    port = 8987
    delay_open_url(f'http://localhost:{port}/game.html', .1)
    serve_pages(port, {
        'ajax.html': update,
    })

if __name__ == "__main__":
    main()

