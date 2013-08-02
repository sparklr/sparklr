#!/bin/bash

# Git Deployment Script
echo "P18 Deployment Script Initiated"

cd /var/www/p18 || exit

unset GIT_DIR
git fetch --all
git reset --hard origin/master

cp /var/www/p18_config.js /var/www/p18/backend/config.js

cd build
node build.js frontend

#MESSAGE=`git log -1 HEAD --pretty=format:%s)`
#MESSAGE=${MESSAGE//\"/\\\"}
#MESSAGE=${MESSAGE//'/\\'}

#echo "use p18; INSERT INTO \`timeline\` (\`from\`, \`time\`, \`message\`) VALUES (12, `date +%s`, \"$MESSAGE\" )" | mysql -u root -pCe3265Bb

# reboot server
sudo -u www-data kill -USR2 `cat /var/www/luna.pid`
