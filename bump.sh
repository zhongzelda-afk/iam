#!/bin/sh
# Stamp a new version on the stylesheet and scripts so browsers fetch fresh copies after each deploy.
V=$(date -u +%Y%m%d%H%M)
sed -i -E "s#(css/styles\.css|js/app\.js|config\.js)(\?v=[0-9]+)?\"#\1?v=$V\"#g" index.html
sed -i -E "s#from \"\./(data|art|body|store|legal)\.js(\?v=[0-9]+)?\"#from \"./\1.js?v=$V\"#g" js/app.js
echo "version $V"
