import './globals.css'
import NextTopLoader from 'nextjs-toploader'
import { RealtimeProvider } from '@/lib/SupabaseRealtimeContext'

export const metadata = {
  title: 'PeerPulse',
  description: 'Peer-driven feedback for professional growth',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <NextTopLoader
          color={`linear-gradient(to right,
                    #ffff00 0%,
                    #ed5a9c 30%,
                    #f49c69 60%,
                    #c044e8 100%)`}
          easing='ease-in'
          speed={350}
          height={7}
          showSpinner={false}
        />
        <RealtimeProvider>
          {children}
        </RealtimeProvider>
      </body>
    </html>
  )
}
