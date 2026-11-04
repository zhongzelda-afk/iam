#!/bin/sh
# Stamp a new version on the stylesheet and every script import so browsers fetch fresh copies after each deploy.
V=$(date -u +%Y%m%d%H%M)
sed -i -E "s#(css/styles\.css|js/app\.js|config\.js)(\?v=[0-9]+)?\"#\1?v=$V\"#g" index.html
find js -name '*.js' -exec sed -i -E "s#(from \"\.{1,2}/[^\"?]+\.js)(\?v=[0-9]+)?\"#\1?v=$V\"#g" {} +
echo "version $V"
