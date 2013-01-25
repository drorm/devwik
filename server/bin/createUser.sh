#!/bin/sh
# Passed variables: 1: username, 2: port their app runs on 3: the app they run
set -e #abort on error
echo Running createUser.sh on user: $1
echo dir:`pwd`
USER=$1
USERHOME=/d/users/$1
APPSDIR=$USERHOME/apps
PORT=$2
APP=$3
sudo adduser $USER --disabled-password --gecos ""
scp server/bin/restartAppLocal.sh server/bin/userSetup.sh $USER@localhost:bin
scp -r public/template $USER@localhost:apps
ssh -q ${USER}@localhost "~/bin/userSetup.sh"
ssh -q $USER@localhost "bin/restartAppLocal.sh ${APP} ${PORT}"
