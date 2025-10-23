import '../globals.css'
import { Navigation } from '@/components/Navigation'
import { Toaster } from 'react-hot-toast'
import NextTopLoader from 'nextjs-toploader'

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
				<Navigation />
				<div className="min-h-screen bg-gray-950">
					<div className="pt-32 pb-8">
						{children}
					</div>
				</div>
				<Toaster />
			</body>
		</html>
	)
}
