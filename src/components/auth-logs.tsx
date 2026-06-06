'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { RefreshCw, Activity, Shield, Clock, LogIn, LogOut } from 'lucide-react';

interface SessionLog { id: string; loginAt: string; logoutAt: string | null; action: string; user: { username: string; name: string; nameMarathi: string; role: string; }; }
interface AuditLog { id: string; action: string; module: string; details: string | null; createdAt: string; user: { username: string; name: string; nameMarathi: string; role: string; }; }

export default function AuthLogs() {
  const [sessions, setSessions] = useState<SessionLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/logs?limit=100');
      if (res.ok) { const data = await res.json(); setSessions(data.sessions || []); setAuditLogs(data.auditLogs || []); }
    } catch { toast({ title: 'त्रुटी', description: 'लॉग लोड अयशस्वी', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  useEffect(() => { if (!autoRefresh) return; const interval = setInterval(fetchLogs, 10000); return () => clearInterval(interval); }, [autoRefresh, fetchLogs]);

  const formatTime = (isoString: string | null) => {
    if (!isoString) return '-';
    try { return new Date(isoString).toLocaleString('mr-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return isoString; }
  };

  const getActionBadge = (action: string) => {
    switch (action.toUpperCase()) {
      case 'LOGIN': return <Badge className="bg-green-600 text-white"><LogIn className="h-3 w-3 mr-1" />लॉगिन</Badge>;
      case 'LOGOUT': return <Badge className="bg-orange-600 text-white"><LogOut className="h-3 w-3 mr-1" />लॉगआउट</Badge>;
      default: return <Badge variant="secondary">{action}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => role === 'gpo' ? <Badge className="bg-green-600 text-white text-xs"><Shield className="h-3 w-3 mr-1" />GPO</Badge> : <Badge className="bg-blue-600 text-white text-xs"><Shield className="h-3 w-3 mr-1" />Operator</Badge>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-lg flex items-center gap-2"><Activity className="h-5 w-5" />लॉगिन/लॉगआउट सत्र ({sessions.length})</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchLogs}><RefreshCw className="h-4 w-4 mr-1" />रिफ्रेश</Button>
              <Button variant={autoRefresh ? 'default' : 'outline'} size="sm" onClick={() => setAutoRefresh(!autoRefresh)}><Clock className="h-4 w-4 mr-1" />{autoRefresh ? 'ऑटो चालू' : 'ऑटो बंद'}</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? <div className="text-center py-8 text-muted-foreground animate-pulse">लोड होत आहे...</div> : (
            <div className="max-h-96 overflow-y-auto border rounded-lg">
              <Table><TableHeader><TableRow><TableHead>युजर</TableHead><TableHead>भूमिका</TableHead><TableHead>क्रिया</TableHead><TableHead>लॉगिन वेळ</TableHead><TableHead>लॉगआउट वेळ</TableHead></TableRow></TableHeader>
              <TableBody>
                {sessions.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">कोणतेही सत्र लॉग नाहीत</TableCell></TableRow> :
                  sessions.map(log => (
                    <TableRow key={log.id}>
                      <TableCell><div className="font-medium">{log.user.nameMarathi || log.user.name}</div><div className="text-xs text-muted-foreground">{log.user.username}</div></TableCell>
                      <TableCell>{getRoleBadge(log.user.role)}</TableCell>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell className="text-sm">{formatTime(log.loginAt)}</TableCell>
                      <TableCell className="text-sm">{formatTime(log.logoutAt)}</TableCell>
                    </TableRow>
                  ))}
              </TableBody></Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">ऑडिट लॉग ({auditLogs.length})</CardTitle></CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto border rounded-lg">
            <Table><TableHeader><TableRow><TableHead>युजर</TableHead><TableHead>भूमिका</TableHead><TableHead>क्रिया</TableHead><TableHead>मॉड्यूल</TableHead><TableHead>तपशील</TableHead><TableHead>वेळ</TableHead></TableRow></TableHeader>
            <TableBody>
              {auditLogs.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">कोणतेही ऑडिट लॉग नाहीत</TableCell></TableRow> :
                auditLogs.map(log => (
                  <TableRow key={log.id}>
                    <TableCell><div className="font-medium">{log.user.nameMarathi || log.user.name}</div><div className="text-xs text-muted-foreground">{log.user.username}</div></TableCell>
                    <TableCell>{getRoleBadge(log.user.role)}</TableCell>
                    <TableCell><Badge variant="outline">{log.action}</Badge></TableCell>
                    <TableCell><Badge variant="secondary">{log.module}</Badge></TableCell>
                    <TableCell className="text-sm max-w-48 truncate">{log.details || '-'}</TableCell>
                    <TableCell className="text-sm">{formatTime(log.createdAt)}</TableCell>
                  </TableRow>
                ))}
            </TableBody></Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
