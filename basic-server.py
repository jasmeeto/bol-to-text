import sys
import ssl
import BaseHTTPServer
from SimpleHTTPServer import SimpleHTTPRequestHandler


HandlerClass = SimpleHTTPRequestHandler
ServerClass  = BaseHTTPServer.HTTPServer
Protocol     = "HTTP/1.0"

if sys.argv[1:]:
    port = int(sys.argv[1])
else:
    port = 80
server_address = ('0.0.0.0', port)

HandlerClass.protocol_version = Protocol
httpd = ServerClass(server_address, HandlerClass)
httpd.socket = ssl.wrap_socket (httpd.socket, certfile='./server.pem', server_side=True)
sa = httpd.socket.getsockname()
print "Serving HTTP on", sa[0], "port", sa[1], "..."
httpd.serve_forever()