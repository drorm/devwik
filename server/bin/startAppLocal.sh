#!/bin/sh
# Passed variables: 1: username, 2: port their app runs on, 3 app name,
set -e #abort on error
echo Running restartApp.sh on user: $1
echo dir:`pwd`
#TODO check for number of variables
USERHOME=../users/$1
APPSDIR=$USERHOME/apps
PORT=$2
APP=$3
PID=`ps ax | grep "meteor.js -p $PORT" | grep -v grep | cut -c1-5`
#echo pid: $PID
cd $APPSDIR/$APP
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
