#!/usr/bin/env bash

rm -rf intergral-deep-datasource || exit $?

rm *.zip* || echo $?

cp -r dist intergral-deep-datasource  || exit $?

VERSION=$(cat package.json | grep version | awk -F'"' '{ print $4 }')

zip intergral-deep-datasource-${VERSION}.zip intergral-deep-datasource -r  || exit $?

md5sum intergral-deep-datasource-${VERSION}.zip > intergral-deep-datasource-${VERSION}.zip.md5  || exit $?

cat intergral-deep-datasource-${VERSION}.zip.md5
