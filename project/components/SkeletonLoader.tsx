import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const SkeletonBox: React.FC<SkeletonProps> = ({ 
  width = '100%', 
  height = 20, 
  borderRadius = 4, 
  style 
}) => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['#E5E7EB', '#F3F4F6'],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor,
        },
        style,
      ]}
    />
  );
};

export const SkeletonCard: React.FC = () => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <SkeletonBox width={60} height={60} borderRadius={30} />
      <View style={styles.cardContent}>
        <SkeletonBox width="70%" height={16} style={{ marginBottom: 8 }} />
        <SkeletonBox width="50%" height={14} style={{ marginBottom: 4 }} />
        <SkeletonBox width="40%" height={12} />
      </View>
    </View>
    <View style={styles.cardBody}>
      <SkeletonBox width="100%" height={12} style={{ marginBottom: 6 }} />
      <SkeletonBox width="80%" height={12} style={{ marginBottom: 6 }} />
      <SkeletonBox width="60%" height={12} />
    </View>
  </View>
);

export const SkeletonClinicCard: React.FC = () => (
  <View style={styles.clinicCard}>
    <SkeletonBox width="100%" height={120} borderRadius={8} style={{ marginBottom: 12 }} />
    <SkeletonBox width="80%" height={18} style={{ marginBottom: 8 }} />
    <SkeletonBox width="60%" height={14} style={{ marginBottom: 6 }} />
    <View style={styles.row}>
      <SkeletonBox width={60} height={24} borderRadius={12} />
      <SkeletonBox width={80} height={24} borderRadius={12} />
    </View>
  </View>
);

export const SkeletonStatCard: React.FC = () => (
  <View style={styles.statCard}>
    <SkeletonBox width={40} height={32} style={{ marginBottom: 8 }} />
    <SkeletonBox width="80%" height={12} />
  </View>
);

export const SkeletonAppointmentCard: React.FC = () => (
  <View style={styles.appointmentCard}>
    <View style={styles.appointmentHeader}>
      <View style={styles.appointmentInfo}>
        <SkeletonBox width="70%" height={16} style={{ marginBottom: 6 }} />
        <SkeletonBox width="50%" height={14} />
      </View>
      <SkeletonBox width={60} height={24} borderRadius={12} />
    </View>
    <View style={styles.appointmentDetails}>
      <SkeletonBox width="60%" height={12} style={{ marginBottom: 4 }} />
      <SkeletonBox width="40%" height={12} style={{ marginBottom: 4 }} />
      <SkeletonBox width="80%" height={12} />
    </View>
    <View style={styles.appointmentFooter}>
      <SkeletonBox width="40%" height={14} />
      <SkeletonBox width={80} height={28} borderRadius={6} />
    </View>
  </View>
);

export const SkeletonPatientCard: React.FC = () => (
  <View style={styles.patientCard}>
    <View style={styles.patientHeader}>
      <SkeletonBox width={48} height={48} borderRadius={24} />
      <View style={styles.patientInfo}>
        <SkeletonBox width="70%" height={16} style={{ marginBottom: 4 }} />
        <SkeletonBox width="80%" height={12} style={{ marginBottom: 2 }} />
        <SkeletonBox width="60%" height={12} />
      </View>
      <SkeletonBox width={50} height={20} borderRadius={10} />
    </View>
    <View style={styles.patientDetails}>
      <SkeletonBox width="90%" height={12} style={{ marginBottom: 4 }} />
      <SkeletonBox width="70%" height={12} style={{ marginBottom: 4 }} />
      <SkeletonBox width="60%" height={12} />
    </View>
    <View style={styles.patientActions}>
      <SkeletonBox width="48%" height={32} borderRadius={6} />
      <SkeletonBox width="48%" height={32} borderRadius={6} />
    </View>
  </View>
);

export const SkeletonPrescriptionCard: React.FC = () => (
  <View style={styles.prescriptionCard}>
    <View style={styles.prescriptionHeader}>
      <View style={styles.medicationInfo}>
        <View style={styles.medicationNameContainer}>
          <SkeletonBox width={20} height={20} borderRadius={10} style={{ marginRight: 8 }} />
          <SkeletonBox width="60%" height={16} />
        </View>
        <SkeletonBox width="40%" height={14} style={{ marginLeft: 28 }} />
      </View>
      <SkeletonBox width={60} height={24} borderRadius={12} />
    </View>
    <View style={styles.prescriptionDetails}>
      <SkeletonBox width="70%" height={12} style={{ marginBottom: 4 }} />
      <SkeletonBox width="80%" height={12} style={{ marginBottom: 4 }} />
      <SkeletonBox width="60%" height={12} style={{ marginBottom: 4 }} />
      <SkeletonBox width="50%" height={12} style={{ marginBottom: 4 }} />
      <SkeletonBox width="65%" height={12} />
    </View>
    <View style={styles.prescriptionFooter}>
      <View style={styles.refillInfo}>
        <SkeletonBox width="40%" height={12} style={{ marginBottom: 2 }} />
        <SkeletonBox width="35%" height={10} />
      </View>
      <View style={styles.actionButtons}>
        <SkeletonBox width={32} height={32} borderRadius={16} />
        <SkeletonBox width={32} height={32} borderRadius={16} />
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
  },
  cardBody: {
    marginTop: 8,
  },
  clinicCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  appointmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentDetails: {
    marginBottom: 12,
  },
  appointmentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  patientCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  patientHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  patientInfo: {
    flex: 1,
    marginLeft: 12,
  },
  patientDetails: {
    marginBottom: 12,
  },
  patientActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  prescriptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  prescriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  medicationInfo: {
    flex: 1,
  },
  medicationNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  prescriptionDetails: {
    marginBottom: 12,
  },
  prescriptionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  refillInfo: {
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
});
