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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gp-teal via-gp-teal-dark to-primary p-4">
      <Card className="w-full max-w-md shadow-2xl border-gp-saffron/20">
        <CardHeader className="text-center space-y-4 pb-2 bg-gradient-to-b from-gp-teal-light to-card rounded-t-lg">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gp-saffron text-white shadow-lg">
            <Landmark className="h-8 w-8" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-gp-teal-dark">ग्रामदर्पण</CardTitle>
            <CardDescription className="text-sm mt-1 text-gp-teal">ग्रामपंचायत ERP पोर्टल</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">युजरनेम</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="युजरनेम टाका"
                required
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">पासवर्ड</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="पासवर्ड टाका"
                  required
                  className="h-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full h-10 bg-gp-teal hover:bg-gp-teal-dark text-white" disabled={loading}>
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                  <span>लॉगिन होत आहे...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  <span>लॉगिन</span>
                </div>
              )}
            </Button>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                डीफॉल्ट: gpo / gpo123
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
