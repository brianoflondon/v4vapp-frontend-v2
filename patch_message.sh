#!/bin/sh
# update version in package.json and commit it
npm version patch
# git add package.json

# put a message in the commit_message.txt file
git log -1 --pretty=%B > public/messages/commit_message.txt
# git add public/messages/commit_message.txt