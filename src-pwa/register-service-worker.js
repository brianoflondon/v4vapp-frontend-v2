import { Notify } from "quasar";
import { register } from "register-service-worker";

// The ready(), registered(), cached(), updatefound() and updated()
// events passes a ServiceWorkerRegistration instance in their arguments.
// ServiceWorkerRegistration: https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration

// change
register(process.env.SERVICE_WORKER_FILE, {
  // The registrationOptions object will be passed as the second argument
  // to ServiceWorkerContainer.register()
  // https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/register#Parameter

  registrationOptions: { scope: "./" },

  ready(/* registration */) {
    console.log("Service worker is active.");
  },

  registered(/* registration */) {
    console.log("Service worker has been registered.");
  },

  cached(/* registration */) {
    console.log("Content has been cached for offline use.");
  },

  updatefound(/* registration */) {
    console.log("New version of app is downloading.");
    Notify.create({
      message: "New version of app is downloading.",
      progress: true,
      color: "positive",
      position: "bottom",
      timeout: 5000, // Make the notification sticky
      actions: [
        {
          // Add an "OK" button
          label: "OK",
          color: "white",
          handler: () => {
            // Dismiss the notification when the "OK" button is clicked
            /* ... */
          },
        },
      ],
    });
  },

  updated(/* registration */) {
    console.log("New version of app is available; please refresh.");
    Notify.create({
      message: "New version of app is available; please refresh.",
      progress: true,
      color: "positive",
      position: "bottom",
      timeout: 0, // Make the notification sticky
      actions: [
        {
          // Add an "OK" button
          label: "OK",
          color: "white",
          handler: () => {
            // Dismiss the notification when the "OK" button is clicked
            /* ... */
          },
        },
      ],
    });
  },

  offline() {
    console.log(
      "No internet connection found. App is running in offline mode.",
    );
  },

  error(err) {
    console.error("Error during service worker registration:", err);
  },
});
