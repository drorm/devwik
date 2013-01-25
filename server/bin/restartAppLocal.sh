#!/bin/bash
# Passed variables: 1: app name, 2: port
set -e #abort on error
#TODO check for number of variables
#export ROOT_URL=http://dror.devwik.com
export PATH=/usr/lib/meteor/bin:${PATH}
export MONGO_URL=mongodb://localhost:27017/`cat ~/.dbname`
APPSDIR=~/apps
APP=$1
PORT=$2
PID=`ps x | grep meteor.js | grep -v grep | cut -c1-5`
echo pid: $PID
cd $APPSDIR/$APP
echo dir:`pwd`
if [[ $PID != ' ' ]] && [[ $PID != '' ]] ; then
  echo kill -TERM $PID #Kill the process and children. Want mongo to exit too if applicable
  kill -TERM $PID #Kill the process and children. Want mongo to exit too if applicable
  echo waiting for the previous one to exit
  sleep 6 #give the old one some time to die
else
  echo No running meteor
fi
rm -f .meteor/local/db/mongod.lock
meteor -p $PORT
