DATE=`date +%b%d`
HOME=.
BUNDLETAR=${HOME}/devwik-${DATE}.tar.gz
EXTRASTAR=${HOME}/extras-${DATE}.tar.gz
cd ${HOME}/devwik
echo meteor bundle $BUNDLETAR
meteor bundle $BUNDLETAR
scp $BUNDLETAR devwik@www.devwik.com:/d/app/new
cd ${HOME}
echo tar cvf ${EXTRASTAR} bundle/server/bin ./bundle/public/template
tar cvf ${EXTRASTAR} bundle/server/bin ./bundle/public/template
scp ${EXTRASTAR} devwik@test1.devwik.com:/d/app/new
