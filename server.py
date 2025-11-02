#!/usr/bin/env python3
import http.server
import socketserver
from pathlib import Path

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()
    
    def guess_type(self, path):
        mimetype, encoding = super().guess_type(path)
        if path.endswith('.js'):
            return 'application/javascript', encoding
        return mimetype, encoding

    def log_message(self, format, *args):
        pass  # Suppress default logging

PORT = 8000

with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
    print(f"Сервер запущен на http://localhost:{PORT}")
    print(f"Главная страница: http://localhost:{PORT}/index.html")
    print(f"Админ-панель: http://localhost:{PORT}/admin.html")
    print("\nНажмите Ctrl+C для остановки\n")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nСервер остановлен")
