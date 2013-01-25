export PATH=/usr/lib/meteor/bin:${PATH}
export PORT=4000
export DEVWIK_ENV=prod
export MONGO_URL=mongodb://localhost:27017/devwik
#set the umask so new files are readable by group and specifically user meteor
umask 0007
#node ../sh/forever.js
meteor -p 5000
