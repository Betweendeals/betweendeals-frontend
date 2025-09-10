import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, ModalContent, ModalBody, Button } from '@heroui/react';
import { Field, Form, FormRenderProps, FieldRenderProps } from 'react-final-form';
import { X, ArrowLeft } from 'lucide-react';
import { authService } from '../../services/users/authenticationService';
import UrlGeneratorService from '../../services/urlMapping/urlGeneratorService';
import CustomInputField from '../main_UI/forms/customInputField';
import CustomPasswordInputField from '../main_UI/forms/customPasswordInputtField';
import { LuInfo } from 'react-icons/lu';
import { useAuthModal } from '../../contexts/AuthModalContext';
import { BetweendealsLogo } from '../common';
import RoleSelectionCards from '../auth/RoleSelectionCards';
import { UserIntent } from '../../utils/contextDetection';
import backgroundImage from '../../../assets/background4.jpg';

interface SignupData {
  email: string;
  password: string;
}

interface SignupFormValues {
  email: string;
  password: string;
}

const SignupModal: React.FC = () => {
  const { activeModal, closeModal, openModal, postAuthRedirect, clearRedirect } = useAuthModal();
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Role selection state
  const [selectedRole, setSelectedRole] = useState<UserIntent | null>(null);
  const [showRoleSelection, setShowRoleSelection] = useState(true);

  const isOpen = activeModal === 'signup';

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      setShowLoginPrompt(false);
      setSelectedRole(null);
      setShowRoleSelection(true);
    }
  }, [isOpen]);

  // Debug modal state
  useEffect(() => {
    console.log('🎭 SignupModal: activeModal =', activeModal, 'isOpen =', isOpen);
    console.log('🎭 SignupModal: postAuthRedirect =', postAuthRedirect);
  }, [activeModal, isOpen, postAuthRedirect]);

  // Handle role selection
  const handleRoleSelect = (role: UserIntent) => {
    console.log('🎯 Role selected:', role);
    setSelectedRole(role);
    setShowRoleSelection(false);
  };

  // Handle back to role selection
  const handleBackToRoleSelection = () => {
    setShowRoleSelection(true);
    setSelectedRole(null);
    setErrorMessage('');
    setShowLoginPrompt(false);
  };

  const handleSignup = async ({ email, password }: SignupData) => {
    console.log('SignupModal: Signing up with role:', selectedRole);

    if (!email || !password) {
      setErrorMessage('Both email and password are required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      console.log('🔑 Attempting signup with role:', selectedRole);
      // Use selected role or default to buyer
      const roleForSignup = selectedRole === 'neutral' ? 'buyer' : selectedRole || 'buyer';
      const response = await authService.createAccount(email, password, email, roleForSignup);
      console.log('✅ Signup successful:', response);

      // CRITICAL: If createAccount doesn't auto-login, we need to login immediately
      console.log('🔄 Attempting auto-login after account creation...');
      try {
        const loginResponse = await authService.login(email, password);
        console.log('✅ Auto-login after signup successful:', loginResponse);
        
        // Dispatch auth change events immediately after successful login
        window.dispatchEvent(new CustomEvent('auth-change'));
        console.log('🔄 Dispatched immediate auth-change event');
      } catch (loginError) {
        console.error('❌ Auto-login failed:', loginError);
        // Show error message and redirect to login
        setErrorMessage('Account created successfully, but auto-login failed. Please login manually.');
        setShowLoginPrompt(true);
        setIsSubmitting(false);
        return;
      }

      handleCloseModal();

      // Small delay to allow auth state to propagate
      setTimeout(() => {
        // FORCE role-based dashboard redirect - ignore postAuthRedirect for signup
        // postAuthRedirect is often set to /listings/new which isn't appropriate for all roles
        console.log('🚀 SIGNUP SUCCESS: Forcing role-based dashboard redirect');
        console.log('👤 User role:', roleForSignup);

        // Always redirect to role-based dashboard after successful signup
        let dashboardUrl: string;

        switch (roleForSignup) {
          case 'seller':
            dashboardUrl = UrlGeneratorService.myBusiness(); // '/my-business/' (like Airbnb host mode)
            break;
          case 'buyer':
            dashboardUrl = UrlGeneratorService.listings(); // '/listings/' (browse listings like Airbnb guests)
            break;
          // Note: 'both' role doesn't come from UserIntent, but if it did:
          // case 'both':
          //   dashboardUrl = UrlGeneratorService.sellerDashboard();
          //   break;
          default:
            // Default to general dashboard (buyer dashboard)
            dashboardUrl = UrlGeneratorService.dashboard(); // '/dashboard'
            break;
        }

        console.log('🚀 Navigating to dashboard:', dashboardUrl);
        navigate(dashboardUrl, { replace: true });

        // Final auth-change event for any remaining components
        console.log('🔄 Final auth-change event dispatch');
        window.dispatchEvent(new CustomEvent('auth-change'));
      }, 100); // Reduced delay since we now handle auth immediately
    } catch (error: any) {
      console.error('❌ Signup failed in SignupModal:', error);
      console.error('❌ Error type:', typeof error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.status,
        stack: error.stack,
      });

      let errorMsg = 'Something went wrong. Please try again later.';

      if (error.status) {
        switch (error.status) {
          case 400:
            errorMsg = 'Both email and password are required.';
            break;
          case 401:
            errorMsg = 'Invalid email or password.';
            break;
          case 409:
            // Special handling for user already exists
            errorMsg = 'An account with this email address already exists.';
            setShowLoginPrompt(true);
            break;
          case 422:
            errorMsg = 'Please enter a valid email address.';
            break;
          case 500:
            errorMsg = 'A server error occurred. Please try again later.';
            break;
          default:
            errorMsg = `An error occurred (${error.status}). Please try again.`;
            break;
        }
      } else {
        if (error.message.includes('409') || error.message.includes('already exists')) {
          errorMsg = 'An account with this email address already exists.';
          setShowLoginPrompt(true);
        } else if (error.message.includes('401') || error.message.includes('invalid')) {
          errorMsg = 'Invalid email or password.';
        } else if (error.message.includes('400')) {
          errorMsg = 'Both email and password are required.';
        } else if (error.message.includes('422')) {
          errorMsg = 'Please enter a valid email address.';
        } else if (error.message.includes('500')) {
          errorMsg = 'A server error occurred. Please try again later.';
        } else if (error.message.includes('Account creation failed')) {
          errorMsg = error.message;
        }
      }

      setErrorMessage(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (isOpen && emailInputRef.current) {
      setTimeout(() => emailInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Clear error message when modal opens
  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
    }
  }, [isOpen]);

  // Custom close handler to clear error state
  const handleCloseModal = () => {
    console.log('🎭 SignupModal: Closing modal');
    setErrorMessage('');
    setShowLoginPrompt(false);
    closeModal();
    // Scroll to top of viewport for clean user experience
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const validate = (values: SignupData) => {
    const errors: Partial<SignupData> = {};
    if (!values.email) {
      errors.email = 'Email address is required.';
    }
    if (!values.password) {
      errors.password = 'Password is required.';
    }
    return errors;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCloseModal}
      size="full"
      backdrop="opaque"
      radius="none"
      shadow="lg"
      isDismissable={true}
      isKeyboardDismissDisabled={false}
      hideCloseButton={true}
      shouldBlockScroll={true}
      portalContainer={document.body}
      classNames={{
        wrapper: '!z-[100]',
        backdrop: '!z-[99] bg-black/80',
        base: '!z-[101] bg-white',
      }}
      motionProps={{
        variants: {
          enter: {
            opacity: 1,
            transition: {
              duration: 0.3,
              ease: 'easeOut',
            },
          },
          exit: {
            opacity: 0,
            transition: {
              duration: 0.2,
              ease: 'easeIn',
            },
          },
        },
      }}
    >
      <ModalContent className="bg-white m-0 rounded-none">
        <ModalBody className="p-0">
          <div className="relative min-h-screen">
            {/* Logo */}
            <div className="absolute top-6 left-6 z-50">
              <button
                onClick={() => {
                  handleCloseModal();
                  navigate(UrlGeneratorService.root());
                }}
                className="hover:opacity-80 transition-opacity duration-200 p-2 rounded-lg hover:bg-slate-100"
              >
                <BetweendealsLogo variant="header" width={40} height={40} className="h-10 w-10" />
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={handleCloseModal}
              className="absolute top-6 right-6 z-50 p-2 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
            >
              <X className="w-5 h-5 text-slate-700" />
            </button>

            {/* Main Content */}
            <Form<SignupFormValues>
              onSubmit={handleSignup}
              validate={validate}
              render={({
                handleSubmit,
                submitting: _submitting,
                pristine: _pristine,
                values: _values,
                errors: _errors,
              }: FormRenderProps<SignupFormValues>) => {
                return (
                  <form data-page="signup" onSubmit={handleSubmit} className="h-full">
                    <div className="grid md:grid-cols-2 min-h-screen">
                      {/* Left Side - Role Selection or Form */}
                      <div className="p-8 flex items-center justify-center bg-white min-h-full">
                        <div className="max-w-md w-full">
                          {showRoleSelection ? (
                            /* Role Selection Mode */
                            <>
                              <div className="mb-8">
                                <h1 className="text-2xl font-semibold text-slate-900 text-left">
                                  Join BetweenDeals
                                </h1>
                                <p className="text-base text-slate-600 mt-2 text-left">
                                  Already have an account?{' '}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      console.log(
                                        '🔄 SignupModal: Login button clicked - opening login modal'
                                      );
                                      openModal('login');
                                    }}
                                    className="text-blue-600 hover:text-blue-700 underline underline-offset-1 transition-colors font-medium"
                                  >
                                    Sign in
                                  </button>
                                </p>
                              </div>
                              <RoleSelectionCards
                                onSelect={handleRoleSelect}
                                className="max-w-sm"
                              />
                            </>
                          ) : (
                            /* Signup Form Mode */
                            <>
                              {/* Header */}
                              <div className="mb-8">
                                <div className="flex items-center justify-between mb-4">
                                  <button
                                    type="button"
                                    onClick={handleBackToRoleSelection}
                                    className="flex items-center text-slate-600 hover:text-slate-900 transition-colors text-sm focus:outline-none focus:text-slate-900"
                                  >
                                    <ArrowLeft className="w-4 h-4 mr-1" />
                                    Back
                                  </button>
                                  {selectedRole && selectedRole !== 'neutral' && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                                      {selectedRole === 'buyer'
                                        ? 'Buyer Account'
                                        : 'Seller Account'}
                                    </span>
                                  )}
                                </div>

                                <h1 className="text-4xl font-bold text-slate-900">
                                  Create your account
                                </h1>
                                <p className="text-base text-slate-600 mt-2">
                                  Already have an account?{' '}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      console.log(
                                        '🔄 SignupModal: Login button clicked - opening login modal'
                                      );
                                      openModal('login');
                                    }}
                                    className="text-blue-600 hover:text-blue-700 underline underline-offset-1 transition-colors font-medium"
                                  >
                                    Log in
                                  </button>
                                </p>
                              </div>
                            </>
                          )}

                          {!showRoleSelection && (
                            <>
                              <div className="flex flex-col">
                                {errorMessage && (
                                  <div
                                    className={`flex items-start mb-4 border-l-4 p-4 rounded-xl ${
                                      showLoginPrompt
                                        ? 'bg-blue-50 border-blue-400 text-blue-700'
                                        : 'bg-red-600 border-red-600 text-red-700'
                                    }`}
                                  >
                                    <p
                                      className={`font-bold text-lg mr-2 mt-0.5 ${
                                        showLoginPrompt ? 'text-blue-600' : 'text-white'
                                      }`}
                                    >
                                      <LuInfo />
                                    </p>
                                    <div
                                      className={`font-normal text-sm ${
                                        showLoginPrompt ? 'text-blue-800' : 'text-white'
                                      }`}
                                    >
                                      <div className="mb-2">{errorMessage}</div>
                                      {showLoginPrompt && (
                                        <div className="mt-3">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              console.log(
                                                '🔄 User exists - switching to login modal'
                                              );
                                              setErrorMessage('');
                                              setShowLoginPrompt(false);
                                              openModal('login');
                                            }}
                                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 hover:border-blue-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                          >
                                            Switch to Login
                                          </button>
                                          <span className="text-blue-600 text-sm ml-2">
                                            or try a different email address
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                <section>
                                  <Field<string>
                                    name="email"
                                    render={(props: FieldRenderProps<string>) => (
                                      <CustomInputField
                                        {...props}
                                        label="Your email address"
                                        type="email"
                                        placeholder=" "
                                        inputRef={emailInputRef}
                                        className=""
                                      />
                                    )}
                                  />
                                </section>

                                <section>
                                  <Field<string>
                                    name="password"
                                    render={(props: FieldRenderProps<string>) => (
                                      <CustomPasswordInputField
                                        {...props}
                                        label="Your password"
                                        inputRef={passwordInputRef}
                                        className=""
                                        placeholder=" "
                                        showPassword={showPassword}
                                        togglePasswordVisibility={togglePasswordVisibility}
                                      />
                                    )}
                                  />
                                </section>

                                {/* Create Account Button */}
                                <Button
                                  type="submit"
                                  color="primary"
                                  size="lg"
                                  disabled={isSubmitting}
                                  className="w-full mt-8"
                                >
                                  {isSubmitting ? 'Creating account...' : 'Create account'}
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Right Side - Image */}
                      <div className="hidden md:block relative">
                        <div
                          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                          style={{ backgroundImage: `url(${backgroundImage})` }}
                        >
                          <div className="absolute inset-0 bg-black/20"></div>
                        </div>
                      </div>
                    </div>
                  </form>
                );
              }}
            />
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default SignupModal;
