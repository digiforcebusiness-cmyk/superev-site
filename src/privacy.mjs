// SuperRev privacy policy (app + website). Source: servepointpos.com/superrev/privacy (May 16, 2026),
// updated for Unity Ads mediation (app 1.0.12+) and a section for superev.app itself.
export const PRIVACY_UPDATED = 'November 27, 2026';
export const CONTACT_EMAIL = 'digiforcebusiness@gmail.com';

export const PRIVACY_HTML = `
<h2>The short version</h2>
<p>SuperRev turns your phone into a real-time engine-sound simulator. It reads your phone's GPS speed and motion sensors to estimate a simulated engine RPM, and plays layered engine audio that responds to how you drive, all on your device.</p>
<p>SuperRev has no accounts and runs no servers of its own. The app displays advertising supplied by Google AdMob, which can fill ad space through its mediation partner Unity Ads; to serve those ads, these advertising SDKs collect certain device and usage information as described below. Apart from advertising, SuperRev does not collect personal data, and it has no analytics or other third-party tracking. This website, superev.app, sets no cookies and runs no analytics or ads.</p>

<h2>1. Who we are</h2>
<p>SuperRev ("the app", "we", "our") is a mobile engine-sound simulator app published by YOUNESS HARNAFI / DIGIFORCE LLC. This Privacy Policy explains what data the app does and does not handle when you use it on Android or iOS, and what happens when you visit superev.app.</p>

<h2>2. Location data</h2>
<p>SuperRev requests location access because the simulated engine RPM is driven partly by how fast you are moving. The phone's GPS speed is read continuously while the app is running and is used, in real time, to calculate the engine sound you hear.</p>
<p>Location used for the engine simulation is processed entirely on your device. It is read by the operating system's location service, used immediately to compute speed and RPM, and then discarded. It is never written to disk as a history, and SuperRev never transmits it to us or stores it on any server.</p>
<p>Separately, the advertising SDKs (Section 6) may infer your approximate location, for example from your IP address, to help select relevant ads. That advertising-related processing is carried out by Google and Unity, not by SuperRev.</p>
<p>If you deny or revoke location permission, the app still works: the engine simulation then relies on the motion sensors and the in-app throttle control.</p>

<h2>3. Motion and other sensors</h2>
<p>SuperRev reads the device's accelerometer (and related motion sensors) to detect acceleration, braking, and the orientation of the phone. This lets the app sense "throttle" (for example, a forward jolt of the phone revs the simulated engine) and calibrate which way the vehicle is pointing.</p>
<p>Sensor readings are used in real time to compute the engine sound and are immediately discarded. They are not recorded, not stored, and not transmitted.</p>

<h2>4. Engine audio</h2>
<p>SuperRev plays engine sound through an audio engine embedded in the app. Audio is rendered entirely on-device from sound files bundled inside the app and played through your phone's speaker or any connected Bluetooth or wired output you choose. The audio engine processes no personal data and makes no network connections.</p>

<h2>5. Data stored only on your device</h2>
<p>The app saves a small amount of information locally so your setup persists between sessions. None of it is transmitted off your device:</p>
<ul>
<li><strong>Selected car</strong>: which engine pack is currently active</li>
<li><strong>Calibration</strong>: the forward-axis orientation you set so motion sensing matches how the phone is mounted</li>
<li><strong>Preferences</strong>: app settings and toggles</li>
</ul>
<p>This data is stored in the device's local app storage. You can clear it at any time by uninstalling the app.</p>

<h2>6. Advertising: Google AdMob and Unity Ads</h2>
<p>SuperRev displays advertising using Google AdMob, Google's mobile advertising service. AdMob uses mediation, which means some ads may be supplied by its partner Unity Ads (Unity Technologies) through the Unity Ads SDK included in the app. To select, deliver, measure, and limit the frequency of ads, these SDKs collect and transmit certain information to Google and, when Unity serves an ad, to Unity. This typically includes:</p>
<ul>
<li><strong>An advertising identifier</strong> (the Android Advertising ID or iOS IDFA): a resettable, per-device ID used for advertising</li>
<li><strong>Device information</strong>, such as device model, operating-system version, language, and screen characteristics</li>
<li><strong>Approximate location</strong>, typically derived from your IP address (not your GPS coordinates)</li>
<li><strong>Ad-interaction data</strong>: whether an ad was shown, viewed, or tapped</li>
</ul>
<p>This information is collected and used by Google and Unity, each acting as an independent third party, and is governed by their own policies: the <a href="https://policies.google.com/privacy" rel="noopener">Google Privacy Policy</a>, <a href="https://policies.google.com/technologies/partner-sites" rel="noopener">How Google uses information from sites or apps that use its services</a>, and the <a href="https://unity.com/legal/game-player-and-app-user-privacy-policy" rel="noopener">Unity Game Player and App User Privacy Policy</a>. SuperRev itself does not receive your advertising identifier, your contact details, or your precise location from this process.</p>
<p>You can limit ad personalization at any time: on Android via Settings → Privacy → Ads (where you can also delete or reset your advertising ID), and on iOS via Settings → Privacy &amp; Security → Tracking and Apple Advertising. Resetting or deleting the advertising ID, or opting out of personalization, does not remove ads but makes them non-personalized.</p>
<p>Aside from Google AdMob and Unity Ads, SuperRev contains no analytics SDKs, no measurement or attribution SDKs, and no other third-party tracking technologies.</p>

<h2>7. Permissions the app requests</h2>
<p>The app requests only the permissions needed for the features it provides:</p>
<ul>
<li><strong>Location</strong> (precise and approximate): to read GPS speed for the RPM simulation (Section 2)</li>
<li><strong>Body / motion sensors and high-sampling-rate sensors</strong>: to read the accelerometer for throttle and orientation sensing (Section 3)</li>
<li><strong>Internet</strong>: used by the advertising SDKs to load advertisements (Section 6)</li>
<li><strong>Advertising ID</strong>: declared so the advertising SDKs can serve ads (Section 6)</li>
</ul>
<p>The app does not request access to your contacts, calendar, microphone, camera, photos, or SMS, and the engine simulation runs only while the app is in the foreground.</p>

<h2>8. Data we do not collect</h2>
<p>SuperRev itself operates no servers that store user data. Other than the advertising data handled by Google AdMob and Unity Ads (Section 6), we do not collect, store, or transmit:</p>
<ul>
<li>Names, email addresses, or phone numbers (the app has no sign-up or account)</li>
<li>Your GPS coordinates, routes, or location history</li>
<li>Motion-sensor recordings or driving history</li>
<li>App usage analytics, telemetry, or crash reports gathered by us</li>
<li>Contacts, photos, calendar, microphone, or camera data</li>
</ul>

<h2>9. This website (superev.app)</h2>
<p>superev.app lets you try SuperRev engine sounds in your browser. The engine simulation and audio run entirely in your browser; nothing you do on the page, including how long you rev, is sent to us.</p>
<ul>
<li><strong>No cookies, no analytics, no ads.</strong> The site sets no cookies and loads no tracking or advertising scripts.</li>
<li><strong>Local storage:</strong> none. The 60-second web limit is counted in memory and resets when you reload.</li>
<li><strong>Hosting logs:</strong> the site is hosted by Vercel, which processes standard request data (such as your IP address, browser type, and the page requested) to deliver and secure the site, under the <a href="https://vercel.com/legal/privacy-policy" rel="noopener">Vercel Privacy Policy</a>.</li>
<li><strong>Audio decoder:</strong> if your browser cannot play the engine audio format natively, the page downloads an open-source audio decoder from the jsDelivr CDN, which receives standard request data in the same way.</li>
<li><strong>Contact form:</strong> if you send us a message from the <a href="/contact/">contact page</a>, your name, email address, and message are delivered to our inbox through Web3Forms, a form-to-email service, and are used only to reply to you. You can also email us directly instead.</li>
<li><strong>Store links:</strong> the App Store and Google Play buttons take you to Apple's and Google's sites, which have their own privacy policies.</li>
</ul>

<h2>10. Children's privacy</h2>
<p>SuperRev is not directed to children under 13 and is intended for a general audience aged 13 and over. The app does not knowingly collect personal information from children. Because the app shows advertising, it is not enrolled in Google Play's "Designed for Families" program. Parents and guardians with questions can contact us at the email below.</p>

<h2>11. Your rights</h2>
<p>SuperRev holds no personal information about you on any server, so there is nothing for us to access, correct, or delete remotely. You retain full control over:</p>
<ul>
<li><strong>On-device data</strong>: uninstall the app to wipe everything it has stored locally</li>
<li><strong>Location and sensor access</strong>: toggle in Android Settings → Apps → SuperRev → Permissions, or iOS Settings → SuperRev</li>
<li><strong>Advertising</strong>: reset or delete your advertising ID and opt out of ad personalization in your device's privacy settings (Section 6)</li>
</ul>
<p>For advertising data held by Google or Unity, you may exercise your rights directly with them under their privacy policies. Users in the European Economic Area, the United Kingdom, California, and other jurisdictions with applicable privacy laws may also contact us with any request; because we hold no personal data ourselves, most such requests will be answered confirming that no data about you exists with us.</p>

<h2>12. Data retention</h2>
<p>We retain no user data because SuperRev collects none on its own servers. Location and sensor readings exist only momentarily in device memory while computing engine sound. On-device preferences persist only as long as the app remains installed. Advertising data collected by Google and Unity is retained under their own retention policies.</p>

<h2>13. International users</h2>
<p>SuperRev is available worldwide. The app itself does not transfer personal data across borders. Advertising requests made by the advertising SDKs, and requests to this website, may be served by global infrastructure operated by Google, Unity, and Vercel, and are subject to their privacy practices.</p>

<h2>14. Changes to this policy</h2>
<p>If we make changes to this Privacy Policy, the updated version will be posted at this URL with a new "Last updated" date at the top. Material changes affecting how data is handled will be highlighted. Continued use of the app after a change indicates acceptance of the revised policy.</p>

<h2>15. Contact</h2>
<p>Questions, concerns, or rights requests can be sent to <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>. We respond within 7 business days.</p>
`;
