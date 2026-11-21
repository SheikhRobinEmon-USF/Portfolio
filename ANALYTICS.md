# Private visit analytics

The portfolio counts its own visits and shows them on a private dashboard at

**https://sheikhrobinemon-usf.github.io/Portfolio/dashboard/**

Only the owner's account can read the data. The site stays plain HTML, CSS and JavaScript:
the tracker and the dashboard talk to Firebase over its public REST API, with no SDK, no
npm packages and no build step.

Until Firebase is connected, nothing is recorded, and the dashboard offers
**Preview with sample data** so you can see how it works.

## What it shows

- **Headline numbers** compared with the previous period: visitors, page views, visits,
  engaged visits, average engaged time and contact actions (email, LinkedIn, downloads).
- **Traffic over time** by hour, day or week, with a table view.
- **Right now:** visitors in the last 30 minutes and the latest visits.
- **Top pages**, **where visitors come from** (LinkedIn, Google, GitHub, Handshake, direct,
  referring pages, `utm_campaign` tags) and **how far down the home page** people scroll,
  section by section.
- **Projects explored:** case study pages and gallery cards opened.
- **Contact and outbound clicks:** LinkedIn, GitHub repos, live demos, email.
- **How they read the site:** the lens chosen (PM, FDE or BA), theme switches, gallery filters,
  assistant and command palette use.
- **Every question asked to the assistant**, newest first, plus the most repeated ones.
- **Location** from the visitor's time zone, languages, devices, browsers, operating systems,
  first-time and returning visitors.
- **When they visit:** a weekday and hour heatmap.
- **Visits:** every session, which you can open to see the full journey: pages, time on each,
  scroll depth, sections reached and each click in order.

Click any page, source, location or language bar to filter the whole dashboard by it.
The menu (`⋯`) downloads page views as CSV or the raw records as JSON.

## One-time setup (about 10 minutes)

Firebase's free Spark plan covers this. It needs no credit card, so there is no bill to run up.

1. **Create the project.** Go to https://console.firebase.google.com, click **Create a project**,
   and name it, for example `robin-portfolio`. You can turn Google Analytics off.
2. **Create the database.** Open **Build > Firestore Database > Create database**. Choose a
   location (for example `nam5 (United States)`) and **Start in production mode**.
3. **Create your login.**
   1. Open **Build > Authentication > Get started**.
   2. Under **Sign-in method**, enable **Email/Password**.
   3. Under **Users**, click **Add user** and enter your email and a strong password.
   4. Copy the **User UID** shown in the list.
4. **Block other sign-ups.** In **Authentication > Settings > User actions**, untick
   **Enable create (sign-up)**. Then only the account you added can exist.
5. **Publish the security rules.**
   1. Open **Firestore Database > Rules**.
   2. Replace everything there with the contents of `firebase/firestore.rules`.
   3. Change `OWNER_UID` to the UID you copied, and click **Publish**.

   The dashboard can also show these rules already filled in. Open **⋯ > Setup and security
   rules** after you sign in.
6. **Get the web settings.**
   1. Open **Project settings** (the gear icon) and go to **General > Your apps**.
   2. Click the web icon `</>`. Give it any nickname and leave Hosting unticked.
   3. From the snippet Firebase shows, copy `apiKey` and `projectId` into
      `assets/js/analytics-config.js`:

      ```js
      window.ANALYTICS_CONFIG = {
        projectId: "robin-portfolio",
        apiKey: "AIza...",
        trackLocal: false
      };
      ```

      These two values are public by design: every Firebase website ships them. What
      protects the data is the rules from step 5.
7. **Publish.** Commit and push. After GitHub Pages updates, visit the site once, then open
   `/dashboard/` and sign in.

### Optional hardening

- **Restrict the API key to your domain.**
  1. In Google Cloud Console, open **APIs & Services > Credentials** and pick the
     "Browser key" Firebase created.
  2. Under **Website restrictions**, add `https://sheikhrobinemon-usf.github.io/*`.
  3. Under **API restrictions**, allow only **Cloud Firestore API**, **Identity Toolkit API**
     and **Token Service API**.

## Don't count your own visits

On the dashboard, open **⋯ > Stop counting this browser**. On your phone or any other
device, open the site once with `?notrack` on the end:

```
https://sheikhrobinemon-usf.github.io/Portfolio/?notrack
```

Use `?track` to undo it.

## Track where a link was shared

Add campaign tags to links you post, and they appear under *Where visitors come from*:

```
https://sheikhrobinemon-usf.github.io/Portfolio/?utm_source=linkedin&utm_campaign=fall-apply
https://sheikhrobinemon-usf.github.io/Portfolio/?utm_source=resume
https://sheikhrobinemon-usf.github.io/Portfolio/?ref=handshake
```

## Privacy and how it works

- **No cookies.** The site stores a random visitor ID and a session ID (ending after 30 idle
  minutes) in `localStorage`. No IP addresses, names or fingerprints are recorded.
- **Location** comes from the browser's time zone (for example `America/New_York`), not from
  the IP address.
- **Opt-outs are honoured.** Browsers sending Do Not Track or Global Privacy Control are not
  recorded. Neither are bots, crawlers, link-preview fetchers or automated browsers.
- **What gets written.** Each page view writes one small record when it opens, and one more
  each time the tab is hidden or closed, carrying what happened since. Records are
  create-only.
- **The rules control access.** Visitors can add a well-formed record stamped with the server
  time and nothing else. Nobody can edit records. Only your UID can read or delete them.
  `firebase/firestore.rules` is the whole policy.
- **What is typed in.** Questions typed into the portfolio assistant are recorded (that is
  the point of the *Questions* panel). Nothing else typed on the site is.

## Limits

- The free plan allows 20,000 record writes and 50,000 reads a day. A visit uses about 2 to 4
  writes. Each dashboard load reads the records for the chosen period and the one before it,
  then only fetches new records when refreshed. A portfolio stays far inside this.
- **The public key can be abused.** Because the key is public, someone could deliberately
  send junk records. The rules limit their shape and size. On the Spark plan, the worst case
  is hitting the daily quota, never a charge. The domain restriction above makes this
  harder.

## Files

```
assets/js/analytics-config.js  Firebase projectId and apiKey (empty = analytics off)
assets/js/track.js             the tracker, loaded on every portfolio page
dashboard/index.html           the private dashboard (not linked from the site, not indexed)
assets/js/dashboard.js         sign-in, data loading and every chart
assets/css/dashboard.css       dashboard styles
firebase/firestore.rules       the security rules to paste into Firebase
```
