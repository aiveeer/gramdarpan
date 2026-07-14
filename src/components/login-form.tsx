'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Landmark, LogIn, Eye, EyeOff } from 'lucide-react';

interface LoginProps {
  onLogin: (userData: { id: string; username: string; name: string; nameMarathi: string; role: string }) => void;
}

export default function LoginForm({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'लॉगिन अयशस्वी');
        return;
      }

      onLogin(data);
    } catch {
      setError('सर्व्हरशी संपर्क होत नाही. कृपया पुन्हा प्रयत्न करा.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#042729] via-gp-teal-dark to-gp-teal p-4 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-20 left-20 h-40 w-40 rounded-full bg-gp-saffron/10 blur-3xl" />
      <div className="absolute bottom-20 right-20 h-56 w-56 rounded-full bg-gp-green/10 blur-3xl" />
      <div className="absolute top-1/2 left-1/3 h-32 w-32 rounded-full bg-gp-purple/10 blur-3xl" />

      <Card className="w-full max-w-md shadow-2xl border-gp-saffron/30 bg-white/95 backdrop-blur-sm relative z-10">
        <CardHeader className="text-center space-y-4 pb-2 bg-gradient-to-b from-gp-teal to-gp-teal-dark rounded-t-lg px-6 py-6">
          <div className="mx-auto flex h-18 w-18 items-center justify-center rounded-2xl bg-gradient-to-br from-gp-saffron to-orange-600 text-white shadow-xl h-[72px] w-[72px]">
            <Landmark className="h-9 w-9" />
          </div>
          <div>
            <CardTitle className="text-2xl font-black text-white drop-shadow-sm">ग्रामदर्पण</CardTitle>
            <CardDescription className="text-sm mt-1 text-gp-saffron font-semibold">ग्रामपंचायत ERP पोर्टल</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="font-semibold text-gp-teal-dark">युजरनेम</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="युजरनेम टाका"
                required
                className="h-11 border-gp-teal/30 focus:border-gp-teal focus:ring-gp-teal/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="font-semibold text-gp-teal-dark">पासवर्ड</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="पासवर्ड टाका"
                  required
                  className="h-11 pr-10 border-gp-teal/30 focus:border-gp-teal focus:ring-gp-teal/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gp-teal"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2">
                <p className="text-sm text-red-600 font-medium">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full h-11 bg-gradient-to-r from-gp-teal to-gp-teal-dark hover:from-gp-teal-dark hover:to-[#042729] text-white font-bold shadow-lg" disabled={loading}>
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>लॉगिन होत आहे...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <LogIn className="h-5 w-5" />
                  <span>लॉगिन</span>
                </div>
              )}
            </Button>

            <div className="text-center">
              <p className="text-xs text-muted-foreground bg-muted/50 rounded-md py-1.5">
                डीफॉल्ट: <span className="font-semibold text-gp-teal">gpo</span> / <span className="font-semibold text-gp-teal">gpo123</span>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
