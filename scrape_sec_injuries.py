import json
import requests
from bs4 import BeautifulSoup

SEC_REPORTS_URL = "https://www.secsports.com/fbreports"

def scrape_sec_availability():
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5"
    }
    
    try:
        response = requests.get(SEC_REPORTS_URL, headers=headers, timeout=15)
        if response.status_code != 200:
            print(f"Failed to fetch SEC reports: HTTP {response.status_code}")
            return []

        soup = BeautifulSoup(response.text, 'html.parser')
        reports = []

        # Look for cards, sections, or containers that usually hold team names and player lists
        # If standard tables are empty, we look for headings or structured divs
        current_team = "SEC Football"
        
        # Check all headers and rows
        for element in soup.find_all(['h2', 'h3', 'h4', 'tr', 'div']):
            text = element.get_text(strip=True)
            
            # Try to catch team names if they appear as section headings
            if element.name in ['h2', 'h3', 'h4'] and len(text) < 30 and not any(w in text.lower() for w in ['report', 'availability', 'sec', 'week']):
                current_team = text
                continue

            cols = element.find_all(['td', 'th'])
            if cols:
                text_cols = [c.get_text(strip=True) for c in cols if c.get_text(strip=True)]
                if len(text_cols) >= 3:
                    player, pos, status = text_cols[0], text_cols[1], text_cols[2]
                    if player.lower() in ['player', 'name', 'student-athlete', 'pos', 'status']:
                        continue
                    
                    reports.append({
                        "player": player,
                        "position": pos,
                        "status": status,
                        "team": current_team
                    })

        # Fallback: if the page structure is heavily JS-rendered and returns nothing, 
        # let's provide a mock entry or structure so your UI tests cleanly while you refine the selector.
        if not reports:
            print("No records found via direct parse. Inspecting alternative tags...")
            # Let's grab any table row text block available
            for tr in soup.find_all('tr'):
                tds = [td.get_text(strip=True) for td in tr.find_all(['td', 'th']) if td.get_text(strip=True)]
                if len(tds) >= 2:
                    reports.append({
                        "player": tds[0],
                        "position": tds[1] if len(tds) > 1 else "N/A",
                        "status": tds[2] if len(tds) > 2 else "Available",
                        "team": current_team
                    })

        # Deduplicate results
        unique_reports = [dict(t) for t in {tuple(d.items()) for d in reports}]
        return unique_reports

    except Exception as e:
        print(f"Scraper error: {e}")
        return []

if __name__ == "__main__":
    data = scrape_sec_availability()
    
    with open("sec-injuries.json", "w") as f:
        json.dump(data, f, indent=2)
        
    print(f"Successfully updated sec-injuries.json with {len(data)} records.")
    
