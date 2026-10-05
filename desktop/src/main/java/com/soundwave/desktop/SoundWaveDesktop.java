package com.soundwave.desktop;

import javafx.application.Application;
import javafx.fxml.FXMLLoader;
import javafx.scene.Scene;
import javafx.stage.Stage;
import com.soundwave.desktop.controllers.MainController;

public class SoundWaveDesktop extends Application {
    @Override
    public void start(Stage stage) throws Exception {
        FXMLLoader loader = new FXMLLoader(
            SoundWaveDesktop.class.getResource("/com/soundwave/desktop/views/main-view.fxml")
        );
        Scene scene = new Scene(loader.load(), 960, 640);
        MainController controller = loader.getController();
        stage.setOnCloseRequest(event -> controller.shutdown());
        scene.getStylesheets().add(
            SoundWaveDesktop.class.getResource("/com/soundwave/desktop/views/styles.css").toExternalForm()
        );
        stage.setTitle("SoundWave");
        stage.setMinWidth(760);
        stage.setMinHeight(520);
        stage.setScene(scene);
        stage.show();
    }

    public static void main(String[] args) {
        launch(args);
    }
}
