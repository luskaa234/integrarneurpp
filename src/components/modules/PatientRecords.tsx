"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApp } from "@/contexts/AppContext";
import { format } from "date-fns";

interface PatientRecordsProps {
  patientId: string;
}

export function PatientRecords({ patientId }: PatientRecordsProps) {
  const { appointments, medicalRecords } = useApp();

  const patientAppointments = appointments.filter((apt) => apt.patient_id === patientId);

  const patientRecords = medicalRecords.filter((rec) =>
    patientAppointments.some((apt) => apt.id === rec.appointment_id)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>📄 Meus Prontuários</CardTitle>
      </CardHeader>
      <CardContent>
        {patientRecords.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Médico</TableHead>
                <TableHead>Resumo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patientRecords.map((rec) => (
                <TableRow key={rec.id}>
                  <TableCell>{format(new Date(rec.date), "dd/MM/yyyy")}</TableCell>
                  <TableCell>{rec.doctorName}</TableCell>
                  <TableCell>{rec.summary}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-gray-500 text-center py-6">Nenhum prontuário encontrado.</p>
        )}
      </CardContent>
    </Card>
  );
}

export default PatientRecords;
