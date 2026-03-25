import './InfoPage.css';

export default function PrivacyPage({ onBack }) {
  return (
    <div className="info-page">
      <div className="info-page-inner">
        <button className="info-back" onClick={onBack}>Back</button>

        <h1 className="info-title">Privacy Policy</h1>
        <p className="info-date">Last updated: March 2026</p>

        <div className="info-body">
          <p>
            This Privacy Policy describes how Collatz Survivor ("we", "us", or "our") collects and uses information when you visit and use this website.
          </p>

          <h2>Information We Collect</h2>

          <h3>Local Storage</h3>
          <p>
            Collatz Survivor stores your game statistics — including daily high scores and the number of cheats used — directly in your browser's local storage. This data never leaves your device and is not transmitted to any server. You can clear this data at any time by clearing your browser's local storage or site data.
          </p>

          <h3>Analytics</h3>
          <p>
            We use Google Analytics to understand how visitors interact with the site. Google Analytics may collect information such as your IP address, browser type, operating system, referring URLs, pages visited, and time spent on those pages. This data is collected in aggregate and is used solely to measure and improve the website's performance.
          </p>
          <p>
            Google Analytics uses cookies and similar tracking technologies to collect this information. For more information on how Google collects and processes data, please review Google's Privacy Policy at <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">policies.google.com/privacy</a>.
          </p>
          <p>
            You can opt out of Google Analytics tracking by installing the <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">Google Analytics Opt-out Browser Add-on</a>.
          </p>

          <h2>Cookies</h2>
          <p>
            We do not set any first-party cookies. Google Analytics may set third-party cookies as described above.
          </p>

          <h2>Data Sharing</h2>
          <p>
            We do not sell, trade, or otherwise transfer your information to third parties, except as described in the Google Analytics section above.
          </p>

          <h2>Children's Privacy</h2>
          <p>
            This website is not directed at children under the age of 13. We do not knowingly collect personal information from children.
          </p>

          <h2>Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Any changes will be reflected on this page with an updated date.
          </p>

          <h2>Contact</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at <a href="mailto:collatzsurvivor@gmail.com">collatzsurvivor@gmail.com</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
