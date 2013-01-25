#!/bin/sh
echo ${USER}-`tr -dc "[:alpha:]" < /dev/urandom | head -c 16` > ~/.dbname
chgrp devwikuser ~ 
chmod 750 ~ 
chmod 660 `find ~/apps -type f`
chmod 6770 `find ~/apps -type d`
chgrp devwikuser `find ~/apps` 
