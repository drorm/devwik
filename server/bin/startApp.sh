#!/bin/sh
# Passed variables: 1: username, 2: port their app runs on 3: the app they run
set -e #abort on error
USER=$1
PORT=$2
APP=$3
echo starting app for user: $1 id: $2  killold: $3
ssh -q $USER@localhost "bin/restartAppLocal.sh ${APP} ${PORT}"
