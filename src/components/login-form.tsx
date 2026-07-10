'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { LogIn, User, Shield, Clock } from 'lucide-react';

interface LoginFormProps {
  /** Callback: parent should set session state from login response data */
  onLoginSuccess: (loginData: {
    id: string;
    username: string;
    name: string;
    nameMarathi: string;
    role: string;
    sessionId: string;
  }) => void;
  /** Callback: parent should handle logout (clear state + call API) */
  onLogout: () => Promise<void>;
}

export default function LoginForm({ onLoginSuccess, onLogout }: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [loginData, setLoginData] = useState<{
    id: string;
    username: string;
    name: string;
    nameMarathi: string;
    role: string;
  } | null>(null);

  // Seed default users on mount (only once)
  useEffect(() => {
    const seedUsers = async () => {
      setSeeding(true);
      try {
        await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'seed' }),
        });
      } catch {
        // ignore
      } finally {
        setSeeding(false);
      }
    };
    seedUsers();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast({ title: 'त्रुटी', description: 'युजरनेम आणि पासवर्ड आवश्यक आहे', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: 'यशस्वी', description: `${data.nameMarathi || data.name} लॉगिन झाले` });
        setUsername('');
        setPassword('');
        // Store login data locally and pass to parent
        setLoginData({ id: data.id, username: data.username, name: data.name, nameMarathi: data.nameMarathi, role: data.role });
        onLoginSuccess(data);
      } else {
        toast({ title: 'लॉगिन अयशस्वी', description: data.error || 'अवैध credentials', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'त्रुटी', description: 'लॉगिन अयशस्वी', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    toast({ title: 'लॉगआउट', description: 'तुम्ही यशस्वीरित्या लॉगआउट झालात' });
    try {
      await onLogout();
    } catch {
      toast({ title: 'त्रुटी', description: 'लॉगआउट अयशस्वी', variant: 'destructive' });
    }
  };

  const formatTime = (isoString: string | null | undefined) => {
    if (!isoString) return '-';
    try {
      return new Date(isoString).toLocaleString('mr-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  if (seeding) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <div className="animate-pulse">डीफॉल्ट युजर तयार करत आहे...</div>
        </CardContent>
      </Card>
    );
  }

  // If login just happened (we have local loginData), show a brief success message
  // But parent should transition to dashboard immediately, so this is a fallback
  if (loginData) {
    return (
      <Card>
        <CardContent className="p-6 text-center space-y-3">
          <div className="text-green-600 text-4xl">✓</div>
          <div className="font-semibold text-lg">{loginData.nameMarathi || loginData.name} लॉगिन झाले</div>
          <div className="text-sm text-muted-foreground animate-pulse">डॅशबोर्ड लोड होत आहे...</div>
        </CardContent>
      </Card>
    );
  }

  // Login form (not authenticated)
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <LogIn className="h-5 w-5" />
          लॉगिन करा
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">युजरनेम</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="युजरनेम टाका"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">पासवर्ड</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="पासवर्ड टाका"
              disabled={loading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <span className="animate-pulse">लॉगिन करत आहे...</span>
            ) : (
              <>
                <LogIn className="h-4 w-4 mr-2" />
                लॉगिन
              </>
            )}
          </Button>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>GPO: <code className="bg-muted px-1 rounded">gpo</code> / <code className="bg-muted px-1 rounded">gpo123</code></p>
            <p>Operator: <code className="bg-muted px-1 rounded">operator</code> / <code className="bg-muted px-1 rounded">op123</code></p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
