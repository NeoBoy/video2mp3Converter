#!/usr/bin/env python3
"""
Simple HTTP server with CORS and SharedArrayBuffer headers
Required for FFmpeg.wasm to work properly
"""

from http.server import HTTPServer, SimpleHTTPRequestHandler
import sys

class CORSRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        
        # Required for SharedArrayBuffer (FFmpeg.wasm)
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
        
        super().end_headers()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

def run(port=8000):
    server_address = ('', port)
    httpd = HTTPServer(server_address, CORSRequestHandler)
    print(f'Server running on http://localhost:{port}/')
    print('Press Ctrl+C to stop')
    print('\nHeaders enabled:')
    print('  - CORS: Access-Control-Allow-Origin: *')
    print('  - Cross-Origin-Opener-Policy: same-origin')
    print('  - Cross-Origin-Embedder-Policy: require-corp')
    print('\nThese headers are required for FFmpeg.wasm to work properly.\n')
    httpd.serve_forever()

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    run(port)
