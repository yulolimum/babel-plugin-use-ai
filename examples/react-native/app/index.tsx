import { Text, View } from "react-native";

export default function Index() {
	function getHelloWorld(): string {
		"use ai";
		throw new Error("Not implemented");
	}

	return (
		<View
			style={{
				flex: 1,
				justifyContent: "center",
				alignItems: "center",
			}}
		>
			<Text>{getHelloWorld()}</Text>
		</View>
	);
}
