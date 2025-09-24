import SellerOnboardingModal, {
  SellerFormData,
} from '@/shared/components/modals/SellerOnboardingModal';
import { SEOHead } from '@/shared/components/seo/SEOHead';
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const EditListingPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [existingData, setExistingData] = useState<SellerFormData | null>(null);
  // Loading states removed for smooth UX
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const listingId = searchParams.get('id');

  // Load existing listing data and auto-open modal
  useEffect(() => {
    const loadExistingListing = async () => {
      if (!listingId) {
        navigate('/my-business/overview');
        return;
      }

      try {
        // TODO: Replace with actual API call to fetch listing data

        // Mock data for now - replace with actual API call
        const mockListingData: SellerFormData = {
          businessType: 'technology',
          businessName: 'Example Tech Company',
          industry: 'Technology',
          country: 'Belgium',
          city: 'Brussels',
          foundedYear: '2018',
          description:
            'A innovative technology company specializing in software solutions for small and medium businesses. We have built a strong reputation for quality service and have a loyal customer base of over 500 active clients.',
          employeeCount: '6-20',
          revenueRange: [500000, 2000000],
          sellingReason: 'retirement',
          timeline: '6-months',
          priceExpectations: '€1.5M - €2.5M',
          contactEmail: 'owner@example.com',
          contactPhone: '+32 2 123 4567',
          wantsVerification: true,
        };

        setExistingData(mockListingData);
        setIsModalOpen(true);
      } catch (error) {
        // Navigate back on error
        navigate('/my-business/overview');
      } finally {
        // No loading state to manage
      }
    };

    loadExistingListing();
  }, [listingId, navigate]);

  const handleModalClose = () => {
    setIsModalOpen(false);
    // Navigate back to business overview when modal closes
    navigate('/my-business/overview');
  };

  const handleListingSave = async (data: SellerFormData) => {
    try {
      // TODO: Replace with actual API call to update listing
      // const response = await fetch(`/api/listings/${listingId}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(data)
      // });

      // Mock API call with realistic delay
      await new Promise(resolve => setTimeout(resolve, 1200));

      // Close modal and navigate back with success message
      setIsModalOpen(false);
      navigate('/business/overview', {
        state: {
          message: 'Your business listing has been saved successfully!',
          type: 'success',
          listingData: data,
        },
      });
    } catch (error) {
      // TODO: Show error state in modal instead of failing silently
      // For now, show generic error
      alert('Failed to save listing changes. Please try again.');
    }
  };

  // Loading screens removed for smooth user experience

  return (
    <>
      <SEOHead
        title="Edit Business Listing | UpSwitch"
        description="Update your business listing on UpSwitch. Modify your listing details to attract the right buyers."
        keywords="edit business listing, update listing, business for sale, UpSwitch"
      />

      <SellerOnboardingModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onComplete={handleListingSave}
        existingData={existingData}
        isEditMode={true}
      />

      {/* Fallback content if modal is not open */}
      {!isModalOpen && (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Opening listing editor...</p>
          </div>
        </div>
      )}
    </>
  );
};

export default EditListingPage;
