'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import {
  PiMagnifyingGlassBold,
  PiNotePencilBold,
  PiGlobeBold,
} from 'react-icons/pi';
import { useTranslations } from 'next-intl';

export default function Login() {
  const { next } = useParams as { next?: string };
  const [email, setEmail] = useState<string>('');
  const [isEmailCooldown, setIsEmailCooldown] = useState(false);
  const t = useTranslations('login');
  const common = useTranslations('common');
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEmailCooldown(true);

    signIn('email', {
      email: email,
      redirect: false,
      ...(next && next.length > 0 ? { callbackUrl: next } : {}),
    }).then((res) => {
      if (res?.ok && !res?.error) {
        setEmail('');
        toast.success('Email sent - check your inbox!');
        setTimeout(() => setIsEmailCooldown(false), 30000);
      } else {
        toast.error('Error sending email - try again?');
        setIsEmailCooldown(false);
      }
    });
  };

  const handleGoogleLogin = () => {
    signIn('google', {
      ...(next && next.length > 0 ? { callbackUrl: next } : {}),
    });
  };

  return (
    <motion.main
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 flex items-center justify-center bg-background p-8 lg:p-16 relative overflow-hidden"
    >
      {/* Gradient background elements */}
      <div className="absolute inset-0 bg-background">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
        <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-primary/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-secondary/5 rounded-full blur-[100px]" />
      </div>

      {/* Content wrapper with glass effect */}
      <div className="relative w-full max-w-6xl flex flex-col lg:flex-row items-center gap-8 lg:gap-16 backdrop-blur-sm">
        {/* Left side - App information */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex-1 space-y-8 text-center lg:text-left"
        >
          <h1 className="text-4xl lg:text-5xl font-bold">{t('title')}</h1>
          <p className="text-xl text-muted-foreground">{t('description')}</p>
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-start gap-4"
            >
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <PiMagnifyingGlassBold className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">
                  {common('benefits.autonomous-keyword-research.title')}
                </h3>
                <p className="text-muted-foreground">
                  {common('benefits.autonomous-keyword-research.description')}
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-start gap-4"
            >
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <PiNotePencilBold className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">
                  {common('benefits.ai-powered-store-optimization.title')}
                </h3>
                <p className="text-muted-foreground">
                  {common('benefits.ai-powered-store-optimization.description')}
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex items-start gap-4"
            >
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <PiGlobeBold className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">
                  {common('benefits.store-synchronization.title')}
                </h3>
                <p className="text-muted-foreground">
                  {common('benefits.store-synchronization.description')}
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Right side - Login form */}
        <div className="w-full max-w-md">
          <Card className="backdrop-blur-md bg-background/80 border-background/20 shadow-xl">
            <CardHeader>
              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center text-3xl font-extrabold"
              >
                {t('sign-in-to-your-account')}
              </motion.h2>
            </CardHeader>
            <CardContent className="space-y-6">
              <form className="space-y-4" onSubmit={handleEmailLogin}>
                <Input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isEmailCooldown}
                >
                  {isEmailCooldown
                    ? t('check-your-email')
                    : t('sign-in-with-email')}
                </Button>
              </form>

              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <span className="relative px-2 bg-background text-muted-foreground">
                  {t('or-continue-with')}
                </span>
              </div>

              <Button
                onClick={handleGoogleLogin}
                variant="outline"
                className="w-full"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z"
                    fill="#4285F4"
                  />
                </svg>
                {t('sign-in-with-google')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.main>
  );
}
