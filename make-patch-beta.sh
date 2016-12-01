rnpackager bundle --include-framework --entry-file index.ios.js --bundle-output /Users/nicholasclark/git/react-native-samples/card-simulator.ios.bundle --platform ios
rnpackager bundle --include-framework --entry-file index.android.js --bundle-output /Users/nicholasclark/git/react-native-samples/card-simulator.android.bundle --platform android
rnpackager bundle --include-framework --entry-file base.ios.js --bundle-output /Users/nicholasclark/git/react-native-samples/base.ios.0.33.0.bundle --platform ios
rnpackager bundle --include-framework --entry-file base.android.js --bundle-output /Users/nicholasclark/git/react-native-samples/base.android.0.33.0.bundle --platform android

pushd /Users/nicholasclark/git/react-native-samples
sh make-card-patch.sh
#popd
#git add *.patch
#git commit -m "Updating card patch files"
#git push
