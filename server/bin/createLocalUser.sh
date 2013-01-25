#!/bin/sh
# Passed variables: 1: username, 2: port their app runs on
set -e #abort on error
echo Running createUser.sh on user: $1
echo dir:`pwd`
USERHOME=../users/$1
APPSDIR=$USERHOME/apps
PORT=$2
APP=$3
mkdir $USERHOME
mkdir $APPSDIR
cp -r public/template/* $APPSDIR
cd $APPSDIR/$APP
meteor -p $PORT
