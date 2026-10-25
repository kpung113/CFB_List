import json
import requests
from bs4 import BeautifulSoup

SEC_REPORTS_URL = "https://www.secsports.com/fbreports"

def scrape_sec_availability():
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    try:
        response = requests.get(SEC_REPORTS_URL, headers=headers, timeout=15)
        if response.status_code != 200:
            print(f"Failed to fetch SEC reports: HTTP {response.status_code}")
            return []

        soup = BeautifulSoup(response.text, 'html.parser')
        reports = []

        tables = soup.find_all('table')
        for table in tables:
            current_team = "SEC Team"
            for row in table.find_all('tr'):
                cols = row.find_all(['td', 'th'])
                if not cols:
                    continue
                
                text_cols = [c.get_text(strip=True) for c in cols]
                
                if len(text_cols) >= 3:
                    player, pos, status = text_cols[0], text_cols[1], text_cols[2]
                    
                    if player.lower() in ['player', 'name', 'student-athlete', 'pos']:
                        continue
                        
                    reports.append({
                        "player": player,
                        "position": pos,
                        "status": status,
                        "team": current_team
                    })

        return reports
    except Exception as e:
        print(f"Scraper error: {e}")
        return []

if __name__ == "__main__":
    data = scrape_sec_availability()
    
    # Save output to file
    with open("sec-injuries.json", "w") as f:
        json.dump(data, f, indent=2)
        
    print(f"Successfully updated sec-injuries.json with {len(data)} records.")
  
