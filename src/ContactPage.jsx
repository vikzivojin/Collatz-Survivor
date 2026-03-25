import './InfoPage.css';

export default function ContactPage({ onBack }) {
  return (
    <div className="info-page">
      <div className="info-page-inner">
        <button className="info-back" onClick={onBack}>Back</button>

        <h1 className="info-title">Contact</h1>

        <div className="info-body">
          <p>
            Have a question, suggestion, or found a bug? We would love to hear from you.
          </p>

          <h2>Email</h2>
          <p>
            You can reach us by email at <a href="mailto:collatzsurvivor@gmail.com">collatzsurvivor@gmail.com</a>. We read every message and will do our best to respond in a timely manner.
          </p>

          <h2>Feedback</h2>
          <p>
            We are always looking to improve Collatz Survivor. If you have ideas for new features, improvements to existing gameplay, or anything else you would like to share, please do not hesitate to get in touch.
          </p>
        </div>
      </div>
    </div>
  );
}
