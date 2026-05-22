export const metadata = {
  title: 'Privacy Policy – GameBooth',
  description: 'GameBooth Privacy Policy',
}

export default function PrivacyPolicy() {
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px', fontFamily: 'system-ui, sans-serif', color: '#111', lineHeight: 1.7 }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Privacy Policy</h1>
      <p style={{ color: '#666', marginBottom: 40 }}>Last updated: May 19, 2026</p>

      <p>GameBooth (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) operates the GameBooth mobile application and website at gamebooth.app. This Privacy Policy explains how we collect, use, and protect your information when you use our service.</p>

      <h2 style={{ fontSize: 22, fontWeight: 600, marginTop: 40, marginBottom: 12 }}>Information We Collect</h2>

      <h3 style={{ fontSize: 17, fontWeight: 600, marginTop: 24, marginBottom: 8 }}>Account Information</h3>
      <p>When you create an account, we collect your email address and any profile information you choose to provide (display name, profile photo).</p>

      <h3 style={{ fontSize: 17, fontWeight: 600, marginTop: 24, marginBottom: 8 }}>Location Data</h3>
      <p>With your permission, we collect your approximate location to help you discover nearby fans, booths, and live events. Location data is not stored permanently and is only used to surface relevant content.</p>

      <h3 style={{ fontSize: 17, fontWeight: 600, marginTop: 24, marginBottom: 8 }}>Audio</h3>
      <p>When you host or participate in a live booth, your voice is transmitted in real time using LiveKit. We do not record or store audio streams.</p>

      <h3 style={{ fontSize: 17, fontWeight: 600, marginTop: 24, marginBottom: 8 }}>Device Information</h3>
      <p>We collect your device push notification token to send you alerts about booths and games you follow. This token is stored securely and used only for push notification delivery.</p>

      <h3 style={{ fontSize: 17, fontWeight: 600, marginTop: 24, marginBottom: 8 }}>Usage Data</h3>
      <p>We collect standard usage information such as which booths you join, artists or teams you follow, and in-app interactions. This helps us improve the service.</p>

      <h2 style={{ fontSize: 22, fontWeight: 600, marginTop: 40, marginBottom: 12 }}>How We Use Your Information</h2>
      <ul style={{ paddingLeft: 24 }}>
        <li>To provide and operate the GameBooth service</li>
        <li>To send push notifications about live booths and events you follow</li>
        <li>To match you with nearby fans at live events</li>
        <li>To improve app performance and user experience</li>
        <li>To respond to support requests</li>
      </ul>

      <h2 style={{ fontSize: 22, fontWeight: 600, marginTop: 40, marginBottom: 12 }}>Third-Party Services</h2>
      <p>GameBooth uses the following third-party services, each with their own privacy policies:</p>
      <ul style={{ paddingLeft: 24 }}>
        <li><strong>Supabase</strong> &ndash; database and authentication</li>
        <li><strong>LiveKit</strong> &ndash; real-time audio streaming</li>
        <li><strong>Firebase (Google)</strong> &ndash; push notifications</li>
      </ul>

      <h2 style={{ fontSize: 22, fontWeight: 600, marginTop: 40, marginBottom: 12 }}>User-Generated Content</h2>
      <p>GameBooth allows users to create and broadcast live commentary. You are responsible for the content you broadcast. We do not pre-screen user content but reserve the right to remove content that violates our Terms of Service.</p>


      <h2 style={{ fontSize: 22, fontWeight: 600, marginTop: 40, marginBottom: 12 }}>Data Retention</h2>
      <p>We retain your account data for as long as your account is active. You may request deletion of your account and associated data at any time by contacting us.</p>

      <h2 style={{ fontSize: 22, fontWeight: 600, marginTop: 40, marginBottom: 12 }}>Children&apos;s Privacy</h2>
      <p>GameBooth is not directed at children under 13. We do not knowingly collect personal information from children under 13.</p>

      <h2 style={{ fontSize: 22, fontWeight: 600, marginTop: 40, marginBottom: 12 }}>Your Rights</h2>
      <p>Depending on your location, you may have the right to access, correct, or delete your personal data. To exercise these rights, contact us at the address below.</p>

      <h2 style={{ fontSize: 22, fontWeight: 600, marginTop: 40, marginBottom: 12 }}>Changes to This Policy</h2>
      <p>We may update this Privacy Policy from time to time. We will notify you of significant changes via the app or email.</p>

      <h2 style={{ fontSize: 22, fontWeight: 600, marginTop: 40, marginBottom: 12 }}>Contact Us</h2>
      <p>If you have questions about this Privacy Policy, contact us at:<br />
        <a href="mailto:support@gamebooth.app" style={{ color: '#0070f3' }}>support@gamebooth.app</a>
      </p>
    </main>
  )
}
