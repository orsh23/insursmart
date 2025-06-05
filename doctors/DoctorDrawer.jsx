import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import DoctorForm from './DoctorForm'; // Import the refactored DoctorForm
import { useTranslation } from "@/components/utils/i18n";
import { Button } from '@/components/ui/button';
import { Doctor } from '@/api/entities';
import { useToast } from '@/components/ui/use-toast';


export default function DoctorDrawer({ open, onClose, doctor, onSave, language }) {
  // const [currentDoctor, setCurrentDoctor] = useState(doctor); // Logic moved to DoctorForm via useDoctorForm
  const { t } = useTranslation(); // language prop might not be needed if useTranslation handles it well
  const { toast } = useToast();


  // useEffect(() => { // Logic moved to DoctorForm via useDoctorForm
  //   setCurrentDoctor(doctor);
  // }, [doctor, open]);

  const handleSaveSuccess = () => {
    if (onSave) {
      onSave(); // This will typically re-fetch doctors list in parent
    }
    // onClose(); // DoctorForm will call onSave, which then calls onClose from parent
  };
  

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl" dir={language === 'he' ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle>
            {doctor ? t('common.editDoctor') : t('common.newDoctor')}
          </DialogTitle>
          <p className="text-sm text-gray-500 mt-1">
            {doctor ? t('common.viewDoctor') : t('common.fillDoctorDetails')}
          </p>
        </DialogHeader>
        
        <DoctorForm
          doctor={doctor}
          onSave={handleSaveSuccess} // onSave in DoctorForm will trigger this
          onCancel={onClose}
        />
        
        {/* Footer is now part of DoctorForm for better control over submit/cancel */}
        {/* <DialogFooter className="sm:justify-start">
          <DialogClose asChild>
             <Button type="button" variant="outline">{t('common.cancel')}</Button>
          </DialogClose>
        </DialogFooter> */}
      </DialogContent>
    </Dialog>
  );
}