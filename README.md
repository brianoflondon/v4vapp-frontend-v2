[![Crowdin](https://badges.crowdin.net/v4vapp/localized.svg)](https://crowdin.com/project/v4vapp)

# V4V.app (v4vapp-frontend-v2)

Frontend for the V4V.app Website and WebApp

## The Plan

I have been learning [Vue 3 and Javascript for over a month now](https://peakd.com/hive-139531/@brianoflondon/learning-vue-3-and-hive-keychain-at-the-same-time). The goal is to completely rebuild [v4v.app](https://v4v.app/) only this time I'll do it all myself and I'll understand it. Previously I had some help starting from @ausbitbank and I tinkered and modified from his work.

## Building in Public

I'm going to be building in public. Right now there is a completely open Github repo for my work and it is a completely virgin Quasar Vue 3 project.

<div class="text-center">

[https://github.com/brianoflondon/v4vapp-frontend-v2](https://github.com/brianoflondon/v4vapp-frontend-v2)

</div>

### Dev features I Need And Will Document

- Docker config to build a container with Nginx
- Github Actions to build a Docker container and upload to Docker Hub
- Perhaps some automated tests (no idea how to do this yet)
- Easy, reusable code with components beginners can understand

### Site Features

Feature parity with existing site including

- Payment of copy pasted Lightning invoices
- Camera to capture Lightning invoices
- Integrations with my own api.v4v.app
- Sign and send payment transactions with Hive Keychain

New features

- Hive Login hopefully with Keychain and HAS
- Hive transactions with both Keychain and HAS
- Displaying relevant Hive profile information

- Integrations with Podcast Index API
- New recurring payments management system

## DHF Plans

I'm not an experienced Vue or Javascript developer. I get stuck all the time on Javascript stuff and I'm using ChatGPT about 50 times a day to help me.

I tried to get some quotes for simply moving my existing Quasar v1 Vue 2 project to Quasar v2 Vue 3 (I didn't chose these version numbers). I got numbers from $5,000 to $15,000.

I felt that I could do this better myself and from it I think it will be a valuable way for others to see how easy the Hive bits of this really are.

As I progress I plan to put this in to the DHF as a new self contained project. I'm happy to hear feedback on this plane now.

---

# Quasar Dev Install

## Install the dependencies

```bash
yarn
# or
npm install
```

### Start the app in development mode (hot-code reloading, error reporting, etc.)

```bash
quasar dev
```

### Lint the files

```bash
yarn lint
# or
npm run lint
```

### Format the files

```bash
yarn format
# or
npm run format
```

### Build the app for production

```bash
quasar build
```

### Customize the configuration

See [Configuring quasar.config.js](https://v2.quasar.dev/quasar-cli-vite/quasar-config-js).
