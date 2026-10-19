import '@fullcalendar/react/skeleton.css';
import './globals.css';
import './styles/layout.css';
import './styles/events.css';
import './styles/auth.css';
import './styles/dashboard.css';
import './styles/calendar.css';
import { AppProviders } from '@/components/providers/AppProviders';

export const metadata = {
  title: 'ACM — Campus events, in motion',
  description: 'Workshops, technical sessions, and campus events from the ACM student chapter.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
