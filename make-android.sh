react-native bundle --entry-file index.android.js --bundle-output /Users/nicholasclark/git/react-native-samples/card-simulator.android.bundle --platform android

pushd /Users/nicholasclark/git/react-native-samples
sh make-card-patch.sh
popd
git add *.patch
git commit -m "Updating card patch files"
git push
