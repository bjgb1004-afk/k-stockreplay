from bs4 import BeautifulSoup
import sys

with open("naver.html", "r", encoding="utf-8") as f:
    html = f.read()

soup = BeautifulSoup(html, "html.parser")
for a in soup.select("a.api_txt_lines.total_tit"):
    print(a.text)
