import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';

export async function GET() {
  try {
    // Test Cloudinary connection by getting account details
    const result = await cloudinary.api.ping();
    
    return NextResponse.json({
      success: true,
      message: 'Cloudinary connection successful',
      status: result.status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cloudinary connection test failed:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Cloudinary connection failed',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}