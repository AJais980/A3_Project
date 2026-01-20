import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const {
			firebaseId,
			email,
			displayName,
			photoURL,
			authMethod,
			isVerified,
			designation,
			institution,
		} = body;

		if (!email) {
			return NextResponse.json(
				{ error: 'Missing required fields' },
				{ status: 400 }
			);
		}

		// Check if user already exists with custom data
		const existingUser = await prisma.user.findUnique({
			where: { email },
			select: { image: true, name: true },
		});

		// Only update image/name if user doesn't have custom ones set already
		// This preserves custom profile data uploaded/edited by the user
		const shouldUpdateImage = !existingUser?.image;
		const shouldUpdateName = !existingUser?.name;

		// Find or create user
		const user = await prisma.user.upsert({
			where: { email },
			update: {
				firebaseId: firebaseId || undefined,
				// Only update name if user doesn't have a custom one
				...(shouldUpdateName && displayName ? { name: displayName } : {}),
				// Only update image if user doesn't have a custom one
				...(shouldUpdateImage && photoURL ? { image: photoURL } : {}),
				authMethod: authMethod || undefined,
				isVerified: isVerified ?? undefined,
				designation: designation || undefined,
				institution: institution || undefined,
			},
			create: {
				email,
				username: email.split('@')[0],
				firebaseId: firebaseId || '',
				name: displayName || email.split('@')[0],
				image: photoURL || '',
				authMethod: authMethod || 'GOOGLE',
				isVerified: isVerified || false,
				designation: designation || null,
				institution: institution || null,
			},
		});

		return NextResponse.json({ user });
	} catch (error) {
		console.error('Error syncing user:', error);
		return NextResponse.json(
			{ error: 'Failed to sync user' },
			{ status: 500 }
		);
	}
}
