import React from 'react';
import { auth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { getUserById } from '@/lib/actions/user.actions';
import Header from '@/components/shared/Header';
import ObjectDetector from '@/components/shared/ObjectDetector';

const ObjectDetectionPage = async () => {
  const { userId } = auth();
  
  if (!userId) redirect('/sign-in');

  const user = await getUserById(userId);

  return (
    <>
      <Header 
        title="Object Detection & Search"
        subtitle="Find and identify objects in images using AI spatial understanding"
      />
      
      <section className="mt-6">
        <ObjectDetector 
          userId={user._id}
          creditBalance={user.creditBalance}
        />
      </section>
    </>
  );
};

export default ObjectDetectionPage;