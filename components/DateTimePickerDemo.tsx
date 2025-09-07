import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { Text } from '~/components/ui/text';
import { CustomDateTimePicker, TimePickerField, FormField } from '~/src/shared/ui';

export function DateTimePickerDemo() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [selectedDateTime, setSelectedDateTime] = useState(new Date());

  return (
    <ScrollView className="flex-1 p-4">
      <View className="gap-6">
        <Text className="text-2xl font-bold mb-4">Date/Time Picker Demo</Text>

        {/* Date Only */}
        <FormField label="Pilih Tanggal">
          <CustomDateTimePicker
            value={selectedDate}
            onChange={(date) => date && setSelectedDate(date)}
            placeholder="Pilih tanggal"
            mode="date"
          />
        </FormField>

        {/* Time Only */}
        <FormField label="Pilih Waktu">
          <CustomDateTimePicker
            value={selectedTime}
            onChange={(time) => time && setSelectedTime(time)}
            placeholder="Pilih waktu"
            mode="time"
          />
        </FormField>

        {/* Date and Time */}
        <FormField label="Pilih Tanggal & Waktu">
          <CustomDateTimePicker
            value={selectedDateTime}
            onChange={(dateTime) => dateTime && setSelectedDateTime(dateTime)}
            placeholder="Pilih tanggal & waktu"
            mode="datetime"
          />
        </FormField>

        {/* Time Picker Field */}
        <FormField label="Time Picker Field">
          <TimePickerField
            value={selectedTime}
            onChange={setSelectedTime}
            placeholder="Pilih waktu dengan TimePickerField"
          />
        </FormField>

        {/* Date with restrictions */}
        <FormField label="Tanggal Maksimal Hari Ini">
          <CustomDateTimePicker
            value={selectedDate}
            onChange={(date) => date && setSelectedDate(date)}
            placeholder="Maksimal hari ini"
            mode="date"
            maximumDate={new Date()}
          />
        </FormField>

        <FormField label="Tanggal Minimal Besok">
          <CustomDateTimePicker
            value={selectedDate}
            onChange={(date) => date && setSelectedDate(date)}
            placeholder="Minimal besok"
            mode="date"
            minimumDate={new Date(Date.now() + 24 * 60 * 60 * 1000)}
          />
        </FormField>

        {/* Results */}
        <View className="mt-6 p-4 bg-card rounded-lg border border-border">
          <Text className="text-lg font-semibold mb-2">Hasil Pilihan:</Text>
          <Text className="mb-1">Tanggal: {selectedDate.toLocaleDateString('id-ID')}</Text>
          <Text className="mb-1">Waktu: {selectedTime.toLocaleTimeString('id-ID')}</Text>
          <Text className="mb-1">Tanggal & Waktu: {selectedDateTime.toLocaleString('id-ID')}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

export default DateTimePickerDemo;
