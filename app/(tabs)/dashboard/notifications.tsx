import { StyleSheet, Text, View } from "react-native";

export default function Notifications() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notifications</Text>
      <Text style={styles.subtitle}>
        You have no notifications at the moment.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
    opacity: 0.6,
    textAlign: "center",
  },
});
